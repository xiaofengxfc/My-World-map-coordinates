/**
 * PNG 图标生成器 - 使用纯 Node.js (无需外部依赖)
 * 生成我的世界坐标记录应用的 PWA 图标
 */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// ---- PNG 工具函数 ----

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crcData = Buffer.concat([typeB, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeB, data, crcVal]);
}

function createPNG(width, height, pixelsRGBA) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = chunk('IHDR', ihdr);

  // IDAT - raw pixel data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixelsRGBA[srcIdx];
      rawData[dstIdx + 1] = pixelsRGBA[srcIdx + 1];
      rawData[dstIdx + 2] = pixelsRGBA[srcIdx + 2];
      rawData[dstIdx + 3] = pixelsRGBA[srcIdx + 3];
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = chunk('IDAT', compressed);

  // IEND
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// ---- 绘制图标 ----

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  // 全部初始化为透明
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 0;
    pixels[i+1] = 0;
    pixels[i+2] = 0;
    pixels[i+3] = 0;
  }

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    pixels[idx] = r;
    pixels[idx+1] = g;
    pixels[idx+2] = b;
    pixels[idx+3] = a;
  }

  function fillRect(x1, y1, x2, y2, r, g, b, a = 255) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function fillRoundedRect(x1, y1, x2, y2, radius, r, g, b, a = 255) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        // 检查是否在圆角范围内
        const inTopLeft = x < x1 + radius && y < y1 + radius;
        const inTopRight = x > x2 - radius && y < y1 + radius;
        const inBottomLeft = x < x1 + radius && y > y2 - radius;
        const inBottomRight = x > x2 - radius && y > y2 - radius;

        if (inTopLeft) {
          const dx = x - (x1 + radius);
          const dy = y - (y1 + radius);
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        if (inTopRight) {
          const dx = x - (x2 - radius);
          const dy = y - (y1 + radius);
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        if (inBottomLeft) {
          const dx = x - (x1 + radius);
          const dy = y - (y2 - radius);
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        if (inBottomRight) {
          const dx = x - (x2 - radius);
          const dy = y - (y2 - radius);
          if (dx * dx + dy * dy > radius * radius) continue;
        }
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function drawCircle(cx, cy, r, fillR, fillG, fillB, fillA = 255) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r * r) {
          setPixel(x, y, fillR, fillG, fillB, fillA);
        }
      }
    }
  }

  function drawCircleStroke(cx, cy, r, strokeR, strokeG, strokeB, strokeW, strokeA = 255) {
    for (let y = cy - r - strokeW; y <= cy + r + strokeW; y++) {
      for (let x = cx - r - strokeW; x <= cx + r + strokeW; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist >= r - strokeW && dist <= r + strokeW) {
          setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
        }
      }
    }
  }

  function drawLine(x1, y1, x2, y2, r, g, b, w, a = 255) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const stepX = dx / len;
    const stepY = dy / len;
    for (let i = 0; i <= len; i++) {
      const x = Math.round(x1 + stepX * i);
      const y = Math.round(y1 + stepY * i);
      for (let wy = -w; wy <= w; wy++) {
        for (let wx = -w; wx <= w; wx++) {
          if (wx * wx + wy * wy <= w * w) {
            setPixel(x + wx, y + wy, r, g, b, a);
          }
        }
      }
    }
  }

  const m = Math.round(size * 0.12);
  const half = Math.round(size / 2);
  const gap = Math.round(size * 0.01);
  const bs = Math.round((size - 2 * m - gap) / 2);
  const radius = Math.round(size * 0.04);

  // 背景渐变 (近似)
  fillRoundedRect(0, 0, size - 1, size - 1, Math.round(size * 0.15), 26, 26, 46);  // #1a1a2e
  // 渐变效果 - 右上角稍亮
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = (x / size + y / size) / 2;
      if (pixels[idx+3] > 0) {
        pixels[idx] = Math.min(255, Math.round(pixels[idx] + dist * 8));
        pixels[idx+1] = Math.min(255, Math.round(pixels[idx+1] + dist * 8));
        pixels[idx+2] = Math.min(255, Math.round(pixels[idx+2] + dist * 16));
      }
    }
  }

  // 四个草地砖块
  const blocks = [
    { x: m, y: m, fill: [58, 107, 30], stroke: [45, 80, 22] },       // #3a6b1e / #2d5016
    { x: m + bs + gap, y: m, fill: [45, 80, 22], stroke: [26, 58, 10] },  // #2d5016 / #1a3a0a
    { x: m, y: m + bs + gap, fill: [45, 80, 22], stroke: [26, 58, 10] },
    { x: m + bs + gap, y: m + bs + gap, fill: [58, 107, 30], stroke: [45, 80, 22] },
  ];

  const br = Math.round(size * 0.03);
  blocks.forEach(b => {
    fillRoundedRect(b.x, b.y, b.x + bs, b.y + bs, br, b.fill[0], b.fill[1], b.fill[2]);
    // 描边
    const sw = Math.max(1, Math.round(size * 0.008));
    // 上边
    fillRect(b.x, b.y, b.x + bs, b.y + sw - 1, b.stroke[0], b.stroke[1], b.stroke[2]);
    // 下边
    fillRect(b.x, b.y + bs - sw, b.x + bs, b.y + bs, b.stroke[0], b.stroke[1], b.stroke[2]);
    // 左边
    fillRect(b.x, b.y, b.x + sw - 1, b.y + bs, b.stroke[0], b.stroke[1], b.stroke[2]);
    // 右边
    fillRect(b.x + bs - sw, b.y, b.x + bs, b.y + bs, b.stroke[0], b.stroke[1], b.stroke[2]);
  });

  // 指南针外圈
  const compassR = Math.round(size * 0.17);
  drawCircleStroke(half, half, compassR, 59, 130, 246, Math.max(1, Math.round(size * 0.02)));

  // 中心点
  drawCircle(half, half, Math.max(1, Math.round(size * 0.03)), 59, 130, 246);

  // 红色指针 (北)
  const northEnd = Math.round(half - compassR * 0.9);
  drawLine(half, half, half, northEnd, 239, 68, 68, Math.max(1, Math.round(size * 0.015)));

  // 白色指针 (东)
  const eastX = Math.round(half + compassR * 0.7);
  const eastY = Math.round(half + compassR * 0.3);
  drawLine(half, half, eastX, eastY, 232, 232, 240, Math.max(1, Math.round(size * 0.012)));

  return createPNG(size, size, pixels);
}

// ---- 生成文件 ----

const outputDir = path.join(__dirname, '..', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('生成图标...');

try {
  // 生成 192x192
  const png192 = drawIcon(192);
  const path192 = path.join(outputDir, 'icon-192.png');
  fs.writeFileSync(path192, png192);
  console.log(`✅ 已生成: icon-192.png (${(png192.length / 1024).toFixed(1)} KB)`);

  // 生成 512x512
  const png512 = drawIcon(512);
  const path512 = path.join(outputDir, 'icon-512.png');
  fs.writeFileSync(path512, png512);
  console.log(`✅ 已生成: icon-512.png (${(png512.length / 1024).toFixed(1)} KB)`);

  // 也生成 apple-touch-icon (180x180 用于 iOS)
  const png180 = drawIcon(180);
  const path180 = path.join(outputDir, 'apple-touch-icon.png');
  fs.writeFileSync(path180, png180);
  console.log(`✅ 已生成: apple-touch-icon.png (${(png180.length / 1024).toFixed(1)} KB)`);

  console.log('\n🎉 所有图标已生成！');
} catch (err) {
  console.error('❌ 生成失败:', err.message);
}
