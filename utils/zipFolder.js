const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const fse = require('fs-extra');

/**
 * Create a clean zip with web files including media assets
 * Maintains directory structure but excludes unwanted files/folders
 */
async function zipFolder(source, out) {
  const tempDir = path.join(source, 'tempdeploy');

  // Clean up tempdeploy if exists
  if (fs.existsSync(tempDir)) {
    await fse.remove(tempDir);
  }

  await fse.mkdir(tempDir);

  // 🔧 Allowed file extensions - Now includes media and web assets
  const allowedExtensions = [
    // Core web files
    '.html', '.htm', '.css', '.js', '.json',
    
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.bmp', '.tiff',
    
    // Videos
    '.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv',
    
    // Audio
    '.mp3', '.wav', '.ogg', '.aac', '.flac', '.wma',
    
    // Fonts
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    
    // Documents & Data
    '.pdf', '.txt', '.xml', '.csv',
    
    // Other web assets
    '.manifest', '.webmanifest'
  ];
  
  // 🔧 Directories to skip
  const skipDirs = [
    '.git', '.svn', '.hg',
    'node_modules', 'dist', 'build', 'out',
    'tempdeploy', '.next', '.nuxt',
    '__pycache__', '.pytest_cache',
    'coverage', '.nyc_output',
    '.vscode', '.idea', '.vs'
  ];

  // 🔧 Files to skip
  const skipFiles = [
    '.gitignore', '.gitattributes',
    '.npmignore', '.eslintrc', '.prettierrc',
    'package.json', 'package-lock.json',
    'yarn.lock', 'composer.json',
    '.env', '.env.local', '.env.example',
    'README.md', 'LICENSE', 'CHANGELOG.md',
    'Dockerfile', 'docker-compose.yml',
    'webpack.config.js', 'vite.config.js',
    'tsconfig.json', 'babel.config.js',
    '.DS_Store', 'Thumbs.db'
  ];

  /**
   * Check if file should be included based on extension and name
   */
  function shouldIncludeFile(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const baseName = path.basename(fileName, ext);
    
    // Skip unwanted files
    if (skipFiles.includes(fileName) || 
        fileName.startsWith('.') || 
        fileName.includes(',') ||
        fileName.includes('~') ||
        fileName.endsWith('.tmp') ||
        fileName.endsWith('.log') ||
        fileName.endsWith('.zip') ||
        fileName.endsWith('.rar') ||
        fileName.endsWith('.tar') ||
        fileName.endsWith('.gz')) {
      return false;
    }
    
    // Include files with allowed extensions
    if (allowedExtensions.includes(ext)) {
      return true;
    }
    
    // Special case: include files without extensions that might be important
    // (like some config files or scripts)
    if (!ext && fileName.length < 250 && !fileName.includes(' ')) {
      // Only if it's a small file (likely config)
      return true;
    }
    
    return false;
  }

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
          // Check if file should be included
          if (shouldIncludeFile(item)) {
            await fse.copy(srcPath, destPath);
            // console.log(`✅ Included: ${itemRelativePath}`);
          } else {
            // console.log(`⏭️ Skipped: ${itemRelativePath}`);
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
    console.log('⚠️ No valid web files found to zip!');
    await fse.remove(tempDir);
    throw new Error('No valid files found for deployment');
  }

  // Show what types of files were included
  const fileTypes = {};
  copiedFiles.forEach(file => {
    const ext = path.extname(file).toLowerCase() || 'no-extension';
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;
  });
  
  // console.log('📊 Files included:');
  // Object.entries(fileTypes).forEach(([ext, count]) => {
  //   console.log(`   ${ext}: ${count} file(s)`);
  // });

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
      // console.log(`📦 Archive created: ${(archive.pointer() / 1024).toFixed(2)} KB`);
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