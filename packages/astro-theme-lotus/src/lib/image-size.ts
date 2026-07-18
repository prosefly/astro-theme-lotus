import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ImageDimensions {
  width: number;
  height: number;
}

export function readPublicImageDimensions(
  src: string,
  publicDir: URL,
): ImageDimensions | undefined {
  const filePath = resolvePublicImagePath(src, publicDir);
  if (!filePath || !existsSync(filePath)) {
    return undefined;
  }

  const ext = extname(filePath).toLowerCase();
  const buffer = readFileSync(filePath);

  if (ext === '.svg') {
    return readSvgDimensions(buffer.toString('utf8'));
  }

  if (ext === '.png') {
    return readPngDimensions(buffer);
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    return readJpegDimensions(buffer);
  }

  if (ext === '.webp') {
    return readWebpDimensions(buffer);
  }

  return undefined;
}

function resolvePublicImagePath(src: string, publicDir: URL): string | undefined {
  if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(src) || src.startsWith('data:')) {
    return undefined;
  }

  const publicRoot = fileURLToPath(publicDir);
  const relativePath = decodeURIComponent(src.startsWith('/') ? src.slice(1) : src);
  const filePath = resolve(publicRoot, relativePath);
  const publicRootPrefix = publicRoot.endsWith(sep) ? publicRoot : `${publicRoot}${sep}`;

  return filePath === publicRoot || filePath.startsWith(publicRootPrefix)
    ? filePath
    : undefined;
}

function readSvgDimensions(svg: string): ImageDimensions | undefined {
  const svgTag = svg.match(/<svg\b[^>]*>/i)?.[0];
  if (!svgTag) {
    return undefined;
  }

  const width = readNumericSvgAttribute(svgTag, 'width');
  const height = readNumericSvgAttribute(svgTag, 'height');
  if (width && height) {
    return { width, height };
  }

  const viewBox = svgTag.match(/\bviewBox=(["'])(.*?)\1/i)?.[2];
  const values = viewBox?.trim().split(/[\s,]+/).map(Number);
  if (values?.length === 4 && values.every(Number.isFinite)) {
    return {
      width: values[2],
      height: values[3],
    };
  }

  return undefined;
}

function readNumericSvgAttribute(tag: string, name: string): number | undefined {
  const value = tag.match(new RegExp(`\\b${name}=(["'])(.*?)\\1`, 'i'))?.[2];
  if (!value || value.endsWith('%')) {
    return undefined;
  }

  const numberValue = Number.parseFloat(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function readPngDimensions(buffer: Buffer): ImageDimensions | undefined {
  if (
    buffer.length < 24
    || buffer.readUInt32BE(0) !== 0x89504e47
    || buffer.readUInt32BE(4) !== 0x0d0a1a0a
  ) {
    return undefined;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer): ImageDimensions | undefined {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return undefined;
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (buffer[offset] === 0xff) {
      offset += 1;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (offset + 2 > buffer.length) {
      break;
    }

    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) {
      break;
    }

    if (isJpegStartOfFrame(marker) && offset + 7 <= buffer.length) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += length;
  }

  return undefined;
}

function isJpegStartOfFrame(marker: number): boolean {
  return (
    (marker >= 0xc0 && marker <= 0xc3)
    || (marker >= 0xc5 && marker <= 0xc7)
    || (marker >= 0xc9 && marker <= 0xcb)
    || (marker >= 0xcd && marker <= 0xcf)
  );
}

function readWebpDimensions(buffer: Buffer): ImageDimensions | undefined {
  if (
    buffer.length < 30
    || buffer.toString('ascii', 0, 4) !== 'RIFF'
    || buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return undefined;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (dataOffset + chunkSize > buffer.length) {
      return undefined;
    }

    if (chunkType === 'VP8X' && chunkSize >= 10) {
      return {
        width: 1 + readUInt24LE(buffer, dataOffset + 4),
        height: 1 + readUInt24LE(buffer, dataOffset + 7),
      };
    }

    if (chunkType === 'VP8L' && chunkSize >= 5 && buffer[dataOffset] === 0x2f) {
      const bits = buffer.readUInt32LE(dataOffset + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    if (chunkType === 'VP8 ' && chunkSize >= 10) {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return undefined;
}

function readUInt24LE(buffer: Buffer, offset: number): number {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}
