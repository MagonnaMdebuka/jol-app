#!/usr/bin/env node
/**
 * Generate PWA icons for Jol
 * Creates simple solid color icons with the Jol brand color
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

const BRAND_COLOR = '#ff7a3d';
const BG_COLOR = '#16110c';

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillRect(0, 0, size, size);

  // Add a simple "J" text
  ctx.fillStyle = BG_COLOR;
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('J', size / 2, size / 2);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Generate icons
generateIcon(192, 'public/icons/icon-192.png');
generateIcon(512, 'public/icons/icon-512.png');

console.log('✓ Icons generated successfully');
