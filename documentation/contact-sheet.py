from PIL import Image, ImageDraw
from pathlib import Path
files=sorted(Path(__file__).parent.glob('contact-*.png'))
sheet=Image.new('RGB',(1600,((len(files)+4)//5)*266),'#182028')
draw=ImageDraw.Draw(sheet)
for i,file in enumerate(files):
 x=(i%5)*320;y=(i//5)*266
 sheet.paste(Image.open(file),(x,y+26));draw.text((x+8,y+6),f'{i*5+2.5:.1f} seconds',fill='white')
sheet.save(Path(__file__).parent/'contact-sheet.png')
