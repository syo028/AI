const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// 設定參數
const MAX_SIZE = 500; // 最大寬高像素
const MAX_FILE_SIZE = 50 * 1024; // 最大文件大小50KB
const QUALITY_RANGE = { min: 50, max: 80 }; // 質量範圍
const INPUT_DIR = './downloaded'; // 輸入目錄
const OUTPUT_DIR = './output_images'; // 輸出目錄

// 確保輸出目錄存在
fs.ensureDirSync(OUTPUT_DIR);

// 獲取所有主題文件夾
const themeFolders = fs.readdirSync(INPUT_DIR).filter(folder => {
  return fs.statSync(path.join(INPUT_DIR, folder)).isDirectory();
});

// 優化單個圖像
async function optimizeImage(inputPath, outputPath) {
  let quality = QUALITY_RANGE.max;
  let outputBuffer;
  
  do {
    // 調整大小並轉換為JPEG
    outputBuffer = await sharp(inputPath)
      .resize(MAX_SIZE, MAX_SIZE, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: quality,
        mozjpeg: true // 使用更高效的mozjpeg壓縮
      })
      .toBuffer();
    
    // 如果文件太大，降低質量
    if (outputBuffer.length > MAX_FILE_SIZE) {
      quality = Math.max(
        QUALITY_RANGE.min, 
        quality - 5 // 每次降低5個質量點
      );
    }
    
    // 如果達到最低質量仍然太大，強制縮小尺寸
    if (quality === QUALITY_RANGE.min && outputBuffer.length > MAX_FILE_SIZE) {
      const metadata = await sharp(inputPath).metadata();
      const scaleFactor = Math.sqrt(MAX_FILE_SIZE / outputBuffer.length) * 0.9;
      const newWidth = Math.floor(metadata.width * scaleFactor);
      const newHeight = Math.floor(metadata.height * scaleFactor);
      
      outputBuffer = await sharp(inputPath)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: QUALITY_RANGE.min,
          mozjpeg: true
        })
        .toBuffer();
    }
  } while (outputBuffer.length > MAX_FILE_SIZE && quality >= QUALITY_RANGE.min);
  
  // 保存優化後的圖像
  await fs.writeFile(outputPath, outputBuffer);
  return outputBuffer.length;
}

// 處理每個主題文件夾
async function processFolders() {
  for (const themeFolder of themeFolders) {
    const inputThemePath = path.join(INPUT_DIR, themeFolder);
    const outputThemePath = path.join(OUTPUT_DIR, themeFolder);
    
    // 創建對應的輸出文件夾
    await fs.ensureDir(outputThemePath);
    
    // 獲取該主題下的所有圖像文件
    const imageFiles = fs.readdirSync(inputThemePath).filter(file => {
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(
        path.extname(file).toLowerCase()
      );
    });
    
    // 處理每張圖像
    for (const imageFile of imageFiles) {
      const inputPath = path.join(inputThemePath, imageFile);
      const outputFilename = path.basename(imageFile, path.extname(imageFile)) + '.jpg';
      const outputPath = path.join(outputThemePath, outputFilename);
      
      try {
        const finalSize = await optimizeImage(inputPath, outputPath);
        console.log(
          `優化成功: ${themeFolder}/${imageFile} => ${outputFilename}` +
          ` (${(finalSize / 1024).toFixed(1)}KB)`
        );
      } catch (error) {
        console.error(`處理失敗: ${themeFolder}/${imageFile}`, error);
      }
    }
  }
  
  console.log('所有圖像處理完成！');
}

// 執行處理
processFolders().catch(console.error);