const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const fse = require('fs-extra');

/**
 * Create a clean zip with only HTML, CSS, JS files
 * Maintains directory structure but excludes unwanted files/folders
 */
async function zipFolder(source, out) {
  const tempDir = path.join(source, 'tempdeploy');

  // Clean up tempdeploy if exists
  if (fs.existsSync(tempDir)) {
    await fse.remove(tempDir);
  }

  await fse.mkdir(tempDir);

  // 🔧 Allowed file extensions
  const allowedExtensions = ['.html', '.css', '.js'];
  
  // 🔧 Directories to skip
  const skipDirs = [
    '.git', '.svn', '.hg',
    'node_modules', 'dist', 'build', 'out',
    'tempdeploy', '.next', '.nuxt',
    '__pycache__', '.pytest_cache',
    'coverage', '.nyc_output'
  ];

  // 🔧 Files to skip
  const skipFiles = [
    '.gitignore', '.gitattributes',
    '.npmignore', '.eslintrc', '.prettierrc',
    'package.json', 'package-lock.json',
    'yarn.lock', 'composer.json',
    '.env', '.env.local', '.env.example',
    'README.md', 'LICENSE',
    'Dockerfile', 'docker-compose.yml'
  ];

  /**
   * Recursively copy only allowed files
   */
  async function copyAllowedFiles(srcDir, destDir, relativePath = '') {
    const items = await fse.readdir(srcDir);
    
    for (const item of items) {
      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);
      const itemRelativePath = path.join(relativePath, item);
      
      try {
        const stat = await fse.stat(srcPath);
        
        if (stat.isDirectory()) {
          // Skip unwanted directories
          if (skipDirs.includes(item) || item.startsWith('.')) {
            continue;
          }
          
          // Create directory and recursively copy
          await fse.mkdir(destPath, { recursive: true });
          await copyAllowedFiles(srcPath, destPath, itemRelativePath);
          
          // Remove empty directories
          const destItems = await fse.readdir(destPath);
          if (destItems.length === 0) {
            await fse.rmdir(destPath);
          }
          
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          const baseName = path.basename(item, ext);
          
          // Skip unwanted files
          if (skipFiles.includes(item) || 
              item.startsWith('.') || 
              item.includes(',') ||
              item.includes('~') ||
              item.endsWith('.tmp') ||
              item.endsWith('.log') ||
              item.endsWith('.zip') ||
              item.endsWith('.rar')) {
            // console.log(`⏭️ Skipped file: ${itemRelativePath}`);
            continue;
          }
          
          // Only include allowed extensions
          if (allowedExtensions.includes(ext)) {
            await fse.copy(srcPath, destPath);
          } else {
            // console.log(`⏭️ Skipped (not allowed): ${itemRelativePath}`);
          }
        }
      } catch (err) {
        console.log(`⚠️ Error processing ${itemRelativePath}: ${err.message}`);
      }
    }
  }

  // Copy only allowed files
  console.log('📁 Scanning files...');
  await copyAllowedFiles(source, tempDir);

  // Check if any files were copied
  const copiedFiles = await getAllFiles(tempDir);
  if (copiedFiles.length === 0) {
    console.log('⚠️ No HTML, CSS, or JS files found to zip!');
    await fse.remove(tempDir);
    throw new Error('No valid files found for deployment');
  }

  // console.log(`📊 Total files to zip: ${copiedFiles.length}`);

  // 🔧 Create zip with better compression and structure
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(out);
    const archive = archiver('zip', { 
      zlib: { level: 9 }, // Maximum compression
      store: false // Don't store uncompressed
    });

    let totalSize = 0;

    archive.on('progress', (progress) => {
      totalSize = progress.fs.processedBytes;
    });

    output.on('close', () => {
      console.log(`📦 Archive created: ${(archive.pointer() / 1024).toFixed(2)} KB`);
      resolve();
    });

    output.on('error', (err) => {
      console.error('Output stream error:', err);
      reject(err);
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    // 🔧 Add files to zip maintaining structure
    archive.directory(tempDir, false);
    
    archive.finalize();
  });

  // console.log('✅ Folder zipped successfully!');

  // Clean up temp directory
  await fse.remove(tempDir);
}

/**
 * Get all files recursively
 */
async function getAllFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const items = await fse.readdir(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = await fse.stat(fullPath);
      
      if (stat.isDirectory()) {
        await scan(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

module.exports = zipFolder;