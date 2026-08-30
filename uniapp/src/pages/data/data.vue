<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  createBackup,
  exportBackupToClipboard,
  exportFullBackupArchive,
  importFullBackupArchive,
  inspectBackupImport,
  listFullBackupArchives,
  mergeBackupItems,
  readBackupFromClipboard,
  shareBackupArchive,
  supportsFullBackupArchive,
} from "@/infrastructure/backup";
import { useWardrobeStore } from "@/stores/wardrobe";
import { useOutfitStore } from "@/stores/outfits";
import { useSettingsStore } from "@/stores/settings";
import { clearAllLocalData } from "@/infrastructure/clear-data";
import { listEvents } from "@/infrastructure/events";
import type { BackupArchiveResult, BackupManifest } from "@/domain/types";
import { useAppTheme } from "@/composables/useAppTheme";

const wardrobe = useWardrobeStore();
const outfits = useOutfitStore();
const settings = useSettingsStore();
const { themeClass } = useAppTheme();
const busy = ref(false);
const dangerOpen = ref(false);
const lastArchive = ref<BackupArchiveResult | null>(null);
const fullBackupSupported = supportsFullBackupArchive();

function comingSoon(): void { uni.showModal({ title: "敬请期待", content: "完整图片 ZIP 备份与恢复正在适配当前 Android 预览版，后续版本开放。", showCancel: false }); }

onShow(() => { wardrobe.hydrate(); outfits.hydrate(); settings.hydrate(); });
const imageCount = computed(() => wardrobe.activeGarments.filter((item) => item.imagePath).length);
const eventCount = computed(() => listEvents().length);

function formatDate(value: number): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function exportDiagnostics(): void {
  const payload = JSON.stringify({ exportedAt: Date.now(), version: "0.1.0", events: listEvents() });
  uni.setClipboardData({ data: payload, success: () => uni.showToast({ title: "诊断日志已复制", icon: "success" }), fail: () => uni.showToast({ title: "复制失败", icon: "none" }) });
}

async function exportMetadata(): Promise<void> {
  try {
    const count = await exportBackupToClipboard();
    uni.showToast({ title: `已复制 ${count} 件单品的元数据`, icon: "success" });
  } catch {
    uni.showToast({ title: "元数据导出失败", icon: "none" });
  }
}

function applyBackup(backup: BackupManifest, replaceConflicts: boolean, restoreSettings = replaceConflicts): void {
  wardrobe.replaceAll(mergeBackupItems(wardrobe.garments, backup.garments, replaceConflicts));
  outfits.replaceAll(mergeBackupItems(outfits.outfits, backup.outfits, replaceConflicts));
  if (restoreSettings) {
    settings.saveProfile(backup.profile);
    settings.savePreferences(backup.preferences);
    if (backup.appMeta) settings.saveAppMeta(backup.appMeta);
  }
  uni.showToast({ title: "恢复完成", icon: "success" });
}

function confirmImport(backup: BackupManifest): void {
  const plan = inspectBackupImport(wardrobe.garments, outfits.outfits, backup);
  const conflictCount = plan.garmentConflicts + plan.outfitConflicts;
  const content = `新增 ${plan.newGarments} 件单品、${plan.newOutfits} 套穿搭${conflictCount ? `；发现 ${conflictCount} 个同 ID 记录` : ""}。`;
  if (!conflictCount) {
    uni.showModal({ title: "确认恢复", content, confirmText: "恢复", success: (result) => result.confirm && applyBackup(backup, false, true) });
    return;
  }
  uni.showActionSheet({
    itemList: ["仅导入新记录，保留本机内容", "用备份覆盖同 ID 内容"],
    success: (result) => {
      uni.showModal({
        title: result.tapIndex === 0 ? "保留本机内容" : "用备份覆盖冲突",
        content,
        confirmText: "继续恢复",
        success: (confirmed) => confirmed.confirm && applyBackup(backup, result.tapIndex === 1),
      });
    },
  });
}

async function importMetadata(): Promise<void> {
  try {
    confirmImport(await readBackupFromClipboard());
  } catch {
    uni.showToast({ title: "剪贴板中没有有效备份", icon: "none" });
  }
}

async function exportFull(): Promise<void> {
  if (!fullBackupSupported) {
    comingSoon();
    return;
  }
  busy.value = true;
  try {
    lastArchive.value = await exportFullBackupArchive();
    uni.showModal({
      title: "完整备份已生成",
      content: `${lastArchive.value.garmentCount} 件单品、${lastArchive.value.imageCount} 张图片已写入 ZIP。\n${lastArchive.value.name}`,
      confirmText: "立即分享",
      cancelText: "稍后",
      success: (result) => result.confirm && lastArchive.value && shareBackupArchive(lastArchive.value.path),
    });
  } catch (error) {
    uni.showModal({ title: "备份失败", content: error instanceof Error ? error.message : "请检查存储空间后重试", showCancel: false });
  } finally {
    busy.value = false;
  }
}

async function restoreFull(): Promise<void> {
  if (!fullBackupSupported) {
    comingSoon();
    return;
  }
  busy.value = true;
  try {
    const archives = await listFullBackupArchives();
    if (!archives.length) {
      uni.showModal({ title: "没有找到备份", content: "请先生成备份，或将备份 ZIP 放入“明天穿什么备份”目录。", showCancel: false });
      return;
    }
    uni.showActionSheet({
      itemList: archives.slice(0, 6).map((item) => formatDate(item.createdAt)),
      success: async (result) => {
        busy.value = true;
        try { confirmImport(await importFullBackupArchive(archives[result.tapIndex].path)); }
        catch (error) { uni.showModal({ title: "恢复失败", content: error instanceof Error ? error.message : "备份包无法读取", showCancel: false }); }
        finally { busy.value = false; }
      },
    });
  } catch (error) {
    uni.showModal({ title: "无法读取备份", content: error instanceof Error ? error.message : "请稍后重试", showCancel: false });
  } finally {
    busy.value = false;
  }
}

function clearAll(): void {
  const backup = createBackup();
  uni.showModal({ title: "确认清空", content: `将删除 ${backup.garments.length} 件衣物、${backup.outfits.length} 套穿搭、偏好和天气缓存。此操作不可恢复。`, confirmColor: "#CF526C", success: (first) => {
    if (!first.confirm) return;
    uni.showModal({ title: "再次确认", content: "真的要清空当前设备上的全部数据吗？", confirmText: "全部清空", confirmColor: "#CF526C", success: (second) => {
      if (!second.confirm) return;
      clearAllLocalData(); wardrobe.hydrate(); outfits.hydrate(); settings.hydrate(); uni.showToast({ title: "已清空所有数据", icon: "none" });
    } });
  } });
}
</script>

<template>
  <view :class="['inner-page','data-page',themeClass]">
    <text class="eyebrow">LOCAL FIRST</text>
    <text class="section-title block">数据与存储</text>
    <view class="storage-card"><text>当前设备</text><text>{{ wardrobe.activeGarments.length }}</text><text>件单品 · {{ imageCount }} 张图片 · {{ outfits.saved.length }} 套已保存穿搭</text><view><text :style="{ width: `${Math.min(100, wardrobe.activeGarments.length / 2)}%` }" /></view><text>达到 180 件时会提醒整理；200 件为体验建议值。</text></view>

    <view class="backup-card">
      <view class="backup-head"><view><text>完整设备备份</text><text>JSON 元数据 + 原图 + 缩略图 ZIP</text></view><text :class="{ ready: fullBackupSupported }">{{ fullBackupSupported ? 'Android 可用' : '敬请期待' }}</text></view>
      <view class="backup-actions"><button :loading="busy" @tap="exportFull">导出完整备份</button><button :loading="busy" @tap="restoreFull">从 ZIP 恢复</button></view>
      <text v-if="lastArchive" class="last-backup">最近导出：{{ formatDate(lastArchive.createdAt) }} · {{ lastArchive.imageCount }} 张图片</text>
    </view>

    <view class="privacy-card"><text>恢复前先预检</text><text>导入时会展示新增数量和同 ID 冲突；你可以保留本机记录，也可以明确选择由备份覆盖，不会静默替换。</text></view>
    <view class="actions">
      <button @tap="exportMetadata"><view><text>复制跨端元数据</text><text>不含图片，适合微信小程序或临时迁移</text></view><text>复制</text></button>
      <button @tap="importMetadata"><view><text>从剪贴板导入</text><text>读取版本化 JSON 并预览冲突</text></view><text>导入</text></button>
      <button @tap="exportDiagnostics"><view><text>复制本地诊断日志</text><text>当前 {{ eventCount }} 条，不包含衣物照片</text></view><text>复制</text></button>
    </view>
    <text class="notice">完整备份文件保存在 Android 公共文档目录的“明天穿什么备份”文件夹，可通过系统分享发送到另一台设备。微信端继续使用不含图片的元数据备份。</text>

    <button class="danger-toggle" :aria-expanded="dangerOpen" @tap="dangerOpen = !dangerOpen">{{ dangerOpen ? '收起危险操作' : '展开危险操作' }}</button>
    <view v-if="dangerOpen" class="danger-zone"><text>清空后无法撤销，建议先导出完整备份。</text><button class="danger" @tap="clearAll">清空所有数据</button></view>
  </view>
</template>

<style scoped lang="scss">
@use "@/styles/theme.scss" as *;

.block { display:block; margin-bottom:26rpx; }
.storage-card { @include card; padding:30rpx; }
.storage-card>text { display:block; }
.storage-card>text:first-child { color:$lilac-deep; font-size:22rpx; font-weight:800; }
.storage-card>text:nth-child(2) { margin-top:12rpx; color:$ink; font-size:72rpx; font-weight:850; }
.storage-card>text:nth-child(3) { color:$muted; font-size:22rpx; }
.storage-card>view { height:14rpx; margin:26rpx 0 12rpx; overflow:hidden; border-radius:999rpx; background:#eee8f2; }
.storage-card>view text { display:block; height:100%; border-radius:999rpx; background:linear-gradient(90deg,$blush,$lilac); }
.storage-card>text:last-child { color:$muted; font-size:20rpx; }
.backup-card { @include card; margin-top:20rpx; padding:26rpx; }
.backup-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16rpx; }
.backup-head view text { display:block; }
.backup-head view text:first-child { color:$ink; font-size:27rpx; font-weight:800; }
.backup-head view text:last-child { margin-top:7rpx; color:$muted; font-size:20rpx; }
.backup-head>text { flex:0 0 auto; min-height:44rpx; padding:0 12rpx; border-radius:999rpx; background:#f1edf3; color:$muted; font-size:18rpx; font-weight:750; line-height:44rpx; }
.backup-head>text.ready { background:#e8f5ed; color:#397254; }
.backup-actions { display:grid; grid-template-columns:1fr 1fr; gap:12rpx; margin-top:22rpx; }
.backup-actions button { min-height:88rpx; margin:0; padding:0 12rpx; border:1rpx solid $line; border-radius:22rpx; background:$lilac-soft; color:$focus; font-size:21rpx; font-weight:750; line-height:88rpx; }
.backup-actions button:first-child { border:0; background:$lilac-deep; color:#fff; }
.last-backup { display:block; margin-top:14rpx; color:$muted; font-size:19rpx; }
.privacy-card { margin-top:20rpx; padding:26rpx; border-radius:28rpx; background:$lilac-soft; }
.privacy-card text { display:block; }
.privacy-card text:first-child { color:$ink; font-size:25rpx; font-weight:800; }
.privacy-card text:last-child { margin-top:9rpx; color:$muted; font-size:21rpx; line-height:1.6; }
.actions { margin-top:20rpx; overflow:hidden; border:1rpx solid $line; border-radius:28rpx; background:#fff; }
.actions button { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:14rpx; width:100%; min-height:122rpx; margin:0; padding:20rpx 24rpx; border-bottom:1rpx solid $line; border-radius:0; background:#fff; text-align:left; }
.actions button:last-child { border-bottom:0; }
.actions button view { min-width:0; }
.actions button view text { display:block; }
.actions button view text:first-child { color:$ink; font-size:25rpx; font-weight:750; }
.actions button view text:last-child { margin-top:7rpx; color:$muted; font-size:20rpx; }
.actions button>text { min-height:44rpx; padding:0 12rpx; border-radius:999rpx; background:$lilac-soft; color:$focus; font-size:18rpx; font-weight:750; line-height:44rpx; }
.notice { display:block; margin:20rpx 6rpx; color:$muted; font-size:20rpx; line-height:1.65; }
.danger-toggle { width:100%; min-height:88rpx; margin-top:20rpx; border:1rpx solid $line; border-radius:24rpx; background:#fff; color:$muted; font-size:22rpx; line-height:88rpx; }
.danger-zone { margin-top:12rpx; padding:22rpx; border:1rpx solid #efc6d1; border-radius:26rpx; background:#fff7f9; }
.danger-zone>text { display:block; color:#8d4c5d; font-size:20rpx; line-height:1.5; }
.danger { width:100%; min-height:88rpx; margin-top:16rpx; border:1rpx solid #e9aebe; border-radius:22rpx; background:#fff; color:$danger; font-size:24rpx; line-height:88rpx; }
</style>
