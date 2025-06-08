gitignore: node_modules, downloaded,db_sqlite3*,package-lock.json
pnpm-lock.yaml

command dairy:
npm init --yes
npm install image-dataset : packageson added one line for dataset



npx image-dataset  --help : show outline how to install
npx image-dataset [options] :
download mode1: 
1. create a list.txt
listed disfferent anime charaters and positions (have many many)

npx image-dataset --listFile list.txt (Run the file)
pop out the chorme to search out the list of pictures
auto add downloaded folder, search the picture put all into this folder

check all picture size: 
file *png / jpeg

cd > different picture's folder
ls-l : see the size
ls-lh : see how big

npm install sharp
主要功能：
圖像調整大小（resize）
圖像格式轉換（如 JPG 轉 PNG）
圖像壓縮
圖像裁剪
添加水印
應用濾鏡效果
圖像旋轉

   const sharp = require('sharp');

   // 調整圖片大小
   sharp('input.jpg')
     .resize(300, 200)
     .toFile('output.jpg');

   // 轉換格式
   sharp('input.jpg')
     .toFormat('png')
     .toFile('output.png');

   // 壓縮圖片
   sharp('input.jpg')
     .jpeg({ quality: 80 })
     .toFile('output.jpg');


npmjs.com
histogram-chart (bonus)