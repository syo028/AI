const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// 設定參數
const CONFIG = {
  MAX_SIZE: 500,                // 最大寬高像素
  MAX_FILE_SIZE: 50 * 1024,     // 50KB大小限制
  QUALITY: { min: 50, max: 80 },// 壓縮質量範圍
  INPUT_DIR: './downloaded',    // 來源目錄
  BACKUP_DIR: './downloaded_backup', // 備份目錄
  CONVERT_FORMAT: 'jpg'         // 統一轉換格式
};

// 確保目錄存在
fs.ensureDirSync(CONFIG.BACKUP_DIR);

// 主處理函式
async function processImages() {
  try {
    // 備份原始檔案 (僅第一次執行時)
    if (!fs.existsSync(path.join(CONFIG.BACKUP_DIR, 'backup_complete.flag'))) {
      await fs.emptyDir(CONFIG.BACKUP_DIR);
      await fs.copy(CONFIG.INPUT_DIR, CONFIG.BACKUP_DIR);
      await fs.writeFile(path.join(CONFIG.BACKUP_DIR, 'backup_complete.flag'), '');
      console.log('✅ 原始檔案已備份至:', CONFIG.BACKUP_DIR);
    }

    // 處理每個主題資料夾
    const themeFolders = fs.readdirSync(CONFIG.INPUT_DIR).filter(folder => {
      return fs.statSync(path.join(CONFIG.INPUT_DIR, folder)).isDirectory();
    });

    for (const folder of themeFolders) {
      const inputPath = path.join(CONFIG.INPUT_DIR, folder);
      const files = fs.readdirSync(inputPath).filter(file => 
        ['.jpg','.jpeg','.png','.webp','.gif'].includes(path.extname(file).toLowerCase())
      );

      console.log(`\n🔄 處理主題 [${folder}] (共 ${files.length} 張圖片)`);

      for (const file of files) {
        const inputFile = path.join(inputPath, file);
        const outputFile = path.join(
          inputPath, 
          path.basename(file, path.extname(file)) + '.' + CONFIG.CONVERT_FORMAT
        );

        try {
          const finalSize = await optimizeAndReplace(inputFile, outputFile);
          console.log(`   ✔ ${file} → ${path.basename(outputFile)} (${(finalSize/1024).toFixed(1)}KB)`);
        } catch (error) {
          console.error(`   ❌ ${file} 處理失敗:`, error.message);
        }
      }
    }

    console.log('\n🎉 所有圖片已處理完成並替換原始檔案');
    console.log(`💾 原始檔案備份位於: ${CONFIG.BACKUP_DIR}`);

  } catch (error) {
    console.error('❌ 主流程錯誤:', error);
  }
}

// 優化並替換圖像
async function optimizeAndReplace(inputPath, outputPath) {
  let quality = CONFIG.QUALITY.max;
  let outputBuffer;

  do {
    outputBuffer = await sharp(inputPath)
      .resize(CONFIG.MAX_SIZE, CONFIG.MAX_SIZE, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(CONFIG.CONVERT_FORMAT, {
        quality: quality,
        mozjpeg: true
      })
      .toBuffer();

    if (outputBuffer.length > CONFIG.MAX_FILE_SIZE) {
      quality = Math.max(CONFIG.QUALITY.min, quality - 5);
    }

    // 最低質量仍過大時縮小尺寸
    if (quality === CONFIG.QUALITY.min && outputBuffer.length > CONFIG.MAX_FILE_SIZE) {
      const metadata = await sharp(inputPath).metadata();
      const scaleFactor = Math.sqrt(CONFIG.MAX_FILE_SIZE / outputBuffer.length) * 0.9;
      outputBuffer = await sharp(inputPath)
        .resize(
          Math.floor(metadata.width * scaleFactor),
          Math.floor(metadata.height * scaleFactor),
          { fit: 'inside' }
        )
        .toFormat(CONFIG.CONVERT_FORMAT, {
          quality: CONFIG.QUALITY.min,
          mozjpeg: true
        })
        .toBuffer();
    }
  } while (outputBuffer.length > CONFIG.MAX_FILE_SIZE && quality >= CONFIG.QUALITY.min);

  // 覆蓋原始檔案
  await fs.writeFile(outputPath, outputBuffer);
  
  // 刪除非目標格式的原始檔案
  if (path.extname(inputPath).toLowerCase() !== `.${CONFIG.CONVERT_FORMAT}`) {
    await fs.unlink(inputPath);
  }

  return outputBuffer.length;
}

// 執行
processImages();