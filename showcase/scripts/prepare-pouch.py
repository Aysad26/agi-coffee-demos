"""Adapt the supplied Coffee Packaging mesh; remove foreign printed artwork.

Usage: python scripts/prepare-pouch.py INPUT.glb OUTPUT.glb
Original: walteraraujo, Coffee Packaging, CC BY 4.0 (see the shipped license).
"""
import json, struct, sys
from pathlib import Path
import numpy as np

source=Path(sys.argv[1]).read_bytes()
json_size=struct.unpack_from('<I',source,12)[0]
doc=json.loads(source[20:20+json_size]);binary=source[28+json_size:]
def accessor(index):
    a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
    n={'VEC3':3,'SCALAR':1}[a['type']]
    return np.frombuffer(binary,dtype={5126:'<f4',5125:'<u4'}[a['componentType']],count=a['count']*n,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,n).copy()

primitive=doc['meshes'][0]['primitives'][0]
raw=accessor(primitive['attributes']['POSITION']);tri=accessor(primitive['indices']).reshape(-1,3)
# Authoring axes are X=width, Y=depth, Z=height. The supplied scene rotates them.
vertices=np.column_stack((raw[:,0]*2.22/18,np.interp(raw[:,2],[-14.500003,3.8,8.206997,14.5],[-2.2,1.30,1.80,2.2]),(-raw[:,1]-4)*.84/9.530079)).astype(float)
# Weld UV island duplicates, then soften the side panels with two Loop steps.
_,unique,inverse=np.unique(np.round(vertices,6),axis=0,return_index=True,return_inverse=True)
vertices=vertices[unique];tri=inverse[tri]
tri=tri[np.array([len(set(t))==3 for t in tri])]
for iteration in range(2):
    neighbors=[set() for _ in vertices];edges={}
    for a,b,c in tri:
        for i,j,k in [(a,b,c),(b,c,a),(c,a,b)]:
            neighbors[i].add(j);neighbors[j].add(i)
            edges.setdefault(tuple(sorted((int(i),int(j)))),[]).append(int(k))
    fixed=(vertices[:,1]>=1.7999)|(vertices[:,1]<=-2.169)
    new=vertices.copy();boundary=[set() for _ in vertices]
    for (a,b),opposites in edges.items():
        if len(opposites)==1:boundary[a].add(b);boundary[b].add(a)
    for i,adj in enumerate(neighbors):
        if fixed[i] or not adj:continue
        if len(boundary[i])==2:
            new[i]=.75*vertices[i]+.125*vertices[list(boundary[i])].sum(0)
        else:
            n=len(adj);beta=3/16 if n==3 else 3/(8*n)
            new[i]=(1-n*beta)*vertices[i]+beta*vertices[list(adj)].sum(0)
    points=list(new);edge_ids={}
    for (a,b),opposites in edges.items():
        if len(opposites)==2 and not (fixed[a] and fixed[b]):
            p=.375*(vertices[a]+vertices[b])+.125*vertices[opposites].sum(0)
        else:p=.5*(vertices[a]+vertices[b])
        edge_ids[(a,b)]=len(points);points.append(p)
    faces=[]
    for a,b,c in tri:
        ab=edge_ids[tuple(sorted((int(a),int(b))))];bc=edge_ids[tuple(sorted((int(b),int(c))))];ca=edge_ids[tuple(sorted((int(c),int(a))))]
        faces.extend([(a,ab,ca),(ab,b,bc),(ca,bc,c),(ab,bc,ca)])
    vertices=np.array(points);tri=np.array(faces,dtype=np.uint32)

# Area-weighted smooth normals, while keeping the front and rear seal planes flat.
normals=np.zeros_like(vertices)
for a,b,c in tri:
    normal=np.cross(vertices[b]-vertices[a],vertices[c]-vertices[a])
    normals[[a,b,c]]+=normal
length=np.linalg.norm(normals,axis=1);normals/=np.maximum(length[:,None],1e-12)
seal=(vertices[:,1]>=1.8-1e-5)
normals[seal & (vertices[:,2]>.002)]=[0,0,1]
normals[seal & (vertices[:,2]<-.002)]=[0,0,-1]
uv=np.column_stack((vertices[:,0]/2.22+.5,vertices[:,1]/4.4+.5))
arrays=[vertices.astype('<f4'),normals.astype('<f4'),uv.astype('<f4'),tri.astype('<u4').ravel()]
buffers=[];views=[];offset=0
for i,a in enumerate(arrays):
    b=a.tobytes();views.append({'buffer':0,'byteOffset':offset,'byteLength':len(b),'target':34963 if i==3 else 34962});buffers.append(b);offset+=len(b)
accessors=[{'bufferView':i,'componentType':5125 if i==3 else 5126,'count':len(a),'type':['VEC3','VEC3','VEC2','SCALAR'][i]} for i,a in enumerate(arrays)]
accessors[0].update(min=vertices.min(0).tolist(),max=vertices.max(0).tolist())
output={'asset':{'version':'2.0','generator':'AGI pouch adaptation','extras':{**doc['asset'].get('extras',{}),'modifications':'Proportions, shoulder and seal height, smoothing; original artwork removed.'}},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':'AGI adapted coffee pouch'}],'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'TEXCOORD_0':2},'indices':3,'material':0}]}],'materials':[{'name':'Black laminated film','pbrMetallicRoughness':{'baseColorFactor':[.012,.012,.012,1],'metallicFactor':0,'roughnessFactor':.32}}],'buffers':[{'byteLength':offset}],'bufferViews':views,'accessors':accessors}
j=json.dumps(output,separators=(',',':')).encode();j+=b' '*((-len(j))%4);b=b''.join(buffers);b+=b'\0'*((-len(b))%4)
result=struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b
Path(sys.argv[2]).write_bytes(result)
print(json.dumps({'vertices':len(vertices),'triangles':len(tri),'bounds':accessors[0],'bytes':len(result)}))
