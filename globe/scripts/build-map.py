"""Build local globe textures from public-domain Natural Earth geography."""
import json, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets'
data = json.loads((ROOT / 'scripts/source/countries.geojson').read_text())
W, H = 2048, 1024
land = Image.new('L', (W,H), 0)
draw = ImageDraw.Draw(land)
countries = {'Ethiopia': Image.new('L',(W,H)), 'Russia': Image.new('L',(W,H))}
for feature in data['features']:
    geom = feature['geometry']
    polys = [geom['coordinates']] if geom['type']=='Polygon' else geom['coordinates']
    country = feature['properties']['ADMIN']
    for poly in polys:
        for index, ring in enumerate(poly):
            pts = [((lon+180)/360*W, (90-lat)/180*H) for lon,lat in ring]
            draw.polygon(pts, fill=255 if index==0 else 0)
            if country in countries:
                ImageDraw.Draw(countries[country]).polygon(pts,fill=255 if index==0 else 0)
land = land.filter(ImageFilter.GaussianBlur(.45))
texture = Image.new('RGB',(W,H))
roughness = Image.new('RGB',(W,H))
random.seed(12)
px, rp, lp = texture.load(), roughness.load(), land.load()
ep, rus = countries['Ethiopia'].load(), countries['Russia'].load()
for y in range(H):
    for x in range(W):
        l=lp[x,y]/255
        noise=random.uniform(-3.5,3.5)
        # Antique champagne gold, warm charcoal oceans, brighter origin country.
        gold = (159,120,63) if not ep[x,y] else (216,171,94)
        if rus[x,y]: gold=(177,135,74)
        dark=(21,20,18)
        px[x,y]=tuple(max(0,min(255,round(dark[k]*(1-l)+(gold[k]+noise)*l))) for k in range(3))
        r=round(151*(1-l)+106*l+noise)
        rp[x,y]=(r,r,r)
texture.save(OUT/'earth-color.webp', quality=95)
roughness.save(OUT/'earth-roughness.webp',quality=94)
land.save(OUT/'earth-height.png')
# Static fallback uses the same geography and remains visible without WebGL.
paths=[]
for feature in data['features']:
    geom=feature['geometry']; polys=[geom['coordinates']] if geom['type']=='Polygon' else geom['coordinates']
    for poly in polys:
        commands=[]
        for ring in poly:
            commands.append('M'+' L'.join(f'{(lon+180)/360*1000:.2f},{(90-lat)/180*500:.2f}' for lon,lat in ring)+'Z')
        paths.append('<path d="'+' '.join(commands)+'"/>')
(OUT/'world.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500"><g fill="#b18c50" opacity=".48" fill-rule="evenodd">'+''.join(paths)+'</g></svg>')
print('Generated geography textures and WebGL fallback from',len(data['features']),'countries.')
