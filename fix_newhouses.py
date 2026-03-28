from pathlib import Path
path=Path('src/pages/apartments/Apartments.tsx')
text=path.read_text()
old="    const newHouses = Array.from({ length: count }).map((_, i) => ({\n      block_id: selectedBlock.id,\n      house_number: ${baseName}\n    }));"
new="    const newHouses = Array.from({ length: count }).map((_, i) => ({\n      block_id: selectedBlock.id,\n      house_number: `${baseName}${i + 1}`\n    }));"
if old not in text:
    raise SystemExit('newhouses block missing')
text=text.replace(old,new,1)
old2='            <div\n                key={house.id}\n                className={`p-3 rounded-xl text-center cursor-pointer ${\n                  house.status === 'occupied' ? 'bg-red-200' : 'bg-green-200'\n                }`}\n              >\n                {house.house_number}\n              </div>'
new2='            <div\n                key={house.id}\n                className={`p-3 rounded-xl text-center cursor-pointer ${\n                  house.status === 'occupied' ? 'bg-red-200' : 'bg-green-200'\n                }`}\n              >\n                {house.house_number}\n              </div>'
if old2 not in text:
    raise SystemExit('houses div missing')
text=text.replace(old2,new2,1)
path.write_text(text)
