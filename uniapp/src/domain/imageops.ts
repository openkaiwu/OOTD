// 像素级图像增强纯函数：输入输出都是 RGBA 平铺数组（Uint8ClampedArray），
// 全部原地修改，供 H5 Canvas 管线调用，domain 层可单测。

type Pixels = Uint8ClampedArray;

export function grayWorldWhiteBalance(data: Pixels): void {
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 8) continue;
    rSum += data[index];
    gSum += data[index + 1];
    bSum += data[index + 2];
    count += 1;
  }
  if (!count) return;
  const rMean = rSum / count, gMean = gSum / count, bMean = bSum / count;
  const gray = (rMean + gMean + bMean) / 3;
  if (rMean < 1 || gMean < 1 || bMean < 1) return;
  // 增益限幅：避免极端色偏被过度矫正，也跳过本来就均衡的图
  const clampGain = (mean: number): number => Math.max(0.8, Math.min(1.45, gray / mean));
  const rGain = clampGain(rMean), gGain = clampGain(gMean), bGain = clampGain(bMean);
  if (Math.abs(rGain - 1) < 0.04 && Math.abs(gGain - 1) < 0.04 && Math.abs(bGain - 1) < 0.04) return;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 8) continue;
    data[index] = data[index] * rGain;
    data[index + 1] = data[index + 1] * gGain;
    data[index + 2] = data[index + 2] * bGain;
  }
}

// 亮度直方图 2%-98% 线性拉伸：修正室内暗光/黄光下的发灰照片
export function percentileStretch(data: Pixels, lowPct = 0.02, highPct = 0.98): void {
  const histogram = new Array<number>(256).fill(0);
  let total = 0;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 8) continue;
    const luma = Math.round(0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]);
    histogram[Math.max(0, Math.min(255, luma))] += 1;
    total += 1;
  }
  if (!total) return;
  const lowTarget = total * lowPct;
  const highTarget = total * highPct;
  let low = 0, high = 255, cumulative = 0;
  for (let bin = 0; bin < 256; bin += 1) {
    cumulative += histogram[bin];
    if (cumulative >= lowTarget) { low = bin; break; }
  }
  cumulative = 0;
  for (let bin = 0; bin < 256; bin += 1) {
    cumulative += histogram[bin];
    if (cumulative >= highTarget) { high = bin; break; }
  }
  if (high - low < 24 || (low <= 0 && high >= 255)) return;
  const scale = 255 / (high - low);
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 8) continue;
    data[index] = (data[index] - low) * scale;
    data[index + 1] = (data[index + 1] - low) * scale;
    data[index + 2] = (data[index + 2] - low) * scale;
  }
}

// 3x3 USM 锐化：可分离盒模糊两遍近似，amount 为强化系数
export function unsharpMask(data: Pixels, width: number, height: number, amount = 0.55): void {
  if (width < 3 || height < 3 || data.length < width * height * 4) return;
  const channelCount = width * height;
  const blur = new Float32Array(channelCount * 3);
  const sample = (x: number, y: number, channel: number): number => {
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));
    return data[(cy * width + cx) * 4 + channel];
  };
  // 水平 + 垂直两遍盒模糊
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        blur[offset + channel] = (sample(x - 1, y, channel) + sample(x, y, channel) + sample(x + 1, y, channel)) / 3;
      }
    }
  }
  const blurred = new Float32Array(channelCount * 3);
  for (let y = 0; y < height; y += 1) {
    const up = Math.max(0, y - 1) * width;
    const mid = y * width;
    const down = Math.min(height - 1, y + 1) * width;
    for (let x = 0; x < width; x += 1) {
      const offset = (mid + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        blurred[offset + channel] = (blur[(up + x) * 3 + channel] + blur[offset + channel] + blur[(down + x) * 3 + channel]) / 3;
      }
    }
  }
  for (let index = 0; index < channelCount; index += 1) {
    const pixel = index * 4;
    for (let channel = 0; channel < 3; channel += 1) {
      const original = data[pixel + channel];
      const soft = blurred[index * 3 + channel];
      data[pixel + channel] = original + amount * (original - soft);
    }
  }
}
