package com.wearing.ootd.preview;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentValues;
import android.content.ClipData;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.location.Location;
import android.location.LocationManager;
import android.location.Address;
import android.location.Geocoder;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.MimeTypeMap;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.net.URL;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import javax.net.ssl.SSLException;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String TAG = "OOTDPreview";
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String START_URL =
            "https://appassets.androidplatform.net/assets/www/index.html?demo=100";
    private static final int REQUEST_FILES = 4101;
    private static final int REQUEST_LOCATION = 4102;
    private static final int REQUEST_CAMERA = 4103;

    private WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private ValueCallback<Uri[]> fileCallback;
    private String pendingGeoOrigin;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private String pendingCameraRequestId;
    private Uri pendingCameraUri;
    private boolean startupErrorShown;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(255, 252, 253));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(true);
        // All page assets ship inside the APK. Never reuse an older APK's WebView cache
        // after an in-place install, otherwise different page versions can be mixed.
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        WebView.setWebContentsDebuggingEnabled(true);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view,
                    WebResourceRequest request
            ) {
                return openBundledAsset(request.getUrl());
            }

            @Override
            @SuppressWarnings("deprecation")
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return openBundledAsset(Uri.parse(url));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_HOST.equalsIgnoreCase(uri.getHost())) {
                    return false;
                }
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.i(TAG, "Page finished: " + url);
                final WebView finishedView = view;
                mainHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        verifyPageRendered(finishedView);
                    }
                }, 6000L);
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error
            ) {
                super.onReceivedError(view, request, error);
                Log.e(TAG, "WebView error " + error.getErrorCode() + ": " + error.getDescription());
                if (request.isForMainFrame()) {
                    showStartupError("页面资源加载失败（" + error.getErrorCode() + "）");
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d(
                        TAG,
                        consoleMessage.messageLevel() + " " + consoleMessage.message()
                                + " @" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber()
                );
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(
                    String origin,
                    GeolocationPermissions.Callback callback
            ) {
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                        == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false);
                    return;
                }
                pendingGeoOrigin = origin;
                pendingGeoCallback = callback;
                requestPermissions(
                        new String[] {
                                Manifest.permission.ACCESS_FINE_LOCATION,
                                Manifest.permission.ACCESS_COARSE_LOCATION
                        },
                        REQUEST_LOCATION
                );
            }

            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    ValueCallback<Uri[]> newFileCallback,
                    FileChooserParams fileChooserParams
            ) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }
                fileCallback = newFileCallback;
                Intent intent = fileChooserParams.createIntent();
                Log.i(TAG, "FileChooser shown, intent=" + intent);
                try {
                    startActivityForResult(intent, REQUEST_FILES);
                    return true;
                } catch (Exception error) {
                    Log.e(TAG, "Unable to open file chooser", error);
                    fileCallback = null;
                    return false;
                }
            }
        });
        webView.addJavascriptInterface(new NativeBridge(), "OOTDNative");

        if (savedInstanceState == null) {
            webView.clearCache(true);
            webView.loadUrl(START_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private final class NativeBridge {
        @JavascriptInterface
        public String getLastKnownLocation(String language) {
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                    != PackageManager.PERMISSION_GRANTED
                    && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                    != PackageManager.PERMISSION_GRANTED) {
                return "";
            }
            try {
                LocationManager manager = (LocationManager) getSystemService(LOCATION_SERVICE);
                Location best = null;
                for (String provider : manager.getProviders(true)) {
                    Location candidate = manager.getLastKnownLocation(provider);
                    if (candidate != null && (best == null || candidate.getTime() > best.getTime())) {
                        best = candidate;
                    }
                }
                if (best == null) return "";
                String city = "";
                if (Geocoder.isPresent()) {
                    try {
                        Locale locale = language == null || language.isEmpty()
                                ? Locale.getDefault() : Locale.forLanguageTag(language);
                        Geocoder geocoder = new Geocoder(MainActivity.this, locale);
                        List<Address> addresses = geocoder.getFromLocation(best.getLatitude(), best.getLongitude(), 1);
                        if (addresses != null && !addresses.isEmpty()) {
                            Address address = addresses.get(0);
                            city = address.getLocality();
                            if (city == null || city.isEmpty()) city = address.getSubAdminArea();
                            if (city == null || city.isEmpty()) city = address.getAdminArea();
                        }
                    } catch (Exception ignored) {
                        // Weather still works when the device has no reverse-geocoding provider.
                    }
                }
                return best.getLatitude() + "\u001f" + best.getLongitude() + "\u001f" + (city == null ? "" : city);
            } catch (Exception error) {
                Log.w(TAG, "Unable to read last known location", error);
                return "";
            }
        }

        @JavascriptInterface
        public void openAppSettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                }
            });
        }

        // 预览 APK 是一个受控 WebView，H5 的文件选择器无法可靠区分“相机”与“相册”。
        // 因此相机入口由原生层直接打开 ACTION_IMAGE_CAPTURE，回传适度压缩的数据 URL 给前端处理。
        @JavascriptInterface
        public boolean capturePhoto(final String requestId) {
            if (requestId == null || requestId.length() == 0) {
                return false;
            }
            Log.w(TAG, "Camera bridge requested: " + requestId);
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    Log.w(TAG, "Camera request executing on UI thread; pending=" + pendingCameraRequestId);
                    if (pendingCameraRequestId != null) {
                        deliverCameraResult(requestId, "", "camera is already in use");
                        return;
                    }
                    pendingCameraRequestId = requestId;
                    Log.w(TAG, "Camera pending ID assigned; opening camera next");
                    // This screen delegates capture to the device's Camera app
                    // with ACTION_IMAGE_CAPTURE. It does not access the camera
                    // hardware itself, so a runtime CAMERA grant for this app
                    // must never prevent the system camera from opening.
                    MainActivity.this.launchCameraCapture();
                }
            });
            return true;
        }

        // 预览壳不具备 APP-PLUS 的 plus.share API。直接调用 Android 系统分享面板，
        // 用户可以选择已安装的聊天、邮件、备忘录等应用完成分享。
        @JavascriptInterface
        public boolean shareText(final String content) {
            if (content == null || content.trim().length() == 0) {
                return false;
            }
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        final File installer = prepareShareableInstaller();
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                                    shareIntent.setType("application/vnd.android.package-archive");
                                    shareIntent.putExtra(Intent.EXTRA_TITLE, "OOTD");
                                    shareIntent.putExtra(Intent.EXTRA_SUBJECT, "OOTD");
                                    shareIntent.putExtra(Intent.EXTRA_TEXT, content);
                                    Uri apkUri = Uri.parse("content://" + ShareProvider.AUTHORITY + "/" + ShareProvider.APK_FILE);
                                    shareIntent.putExtra(Intent.EXTRA_STREAM, apkUri);
                                    shareIntent.setClipData(ClipData.newRawUri("OOTD.apk", apkUri));
                                    shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                                    startActivity(Intent.createChooser(shareIntent, "OOTD"));
                                } catch (Exception error) {
                                    Log.w(TAG, "Unable to open app invite share", error);
                                }
                            }
                        });
                    } catch (Exception error) {
                        Log.w(TAG, "Unable to prepare app invite", error);
                    }
                }
            }, "OOTD-AppInvite").start();
            return true;
        }

        @JavascriptInterface
        public boolean sharePlainText(final String content) {
            if (content == null || content.trim().length() == 0) return false;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent shareIntent = new Intent(Intent.ACTION_SEND);
                        shareIntent.setType("text/plain");
                        shareIntent.putExtra(Intent.EXTRA_TITLE, "OOTD");
                        shareIntent.putExtra(Intent.EXTRA_TEXT, content);
                        startActivity(Intent.createChooser(shareIntent, "OOTD"));
                    } catch (Exception error) {
                        Log.w(TAG, "Unable to open text share", error);
                    }
                }
            });
            return true;
        }

        // 大模型 HTTP 桥：页面源是 appassets.androidplatform.net，直连外部 API 会被
        // WebView 的 CORS 拦截，由原生网络栈代发请求后把结果回投给页面。
        // 异步设计：桥方法立即返回，避免阻塞 JS 线程等待大模型响应。
        @JavascriptInterface
        public void llmChat(final String requestId, final String url, final String apiKey, final String bodyJson) {
            if (requestId == null || url == null || apiKey == null || bodyJson == null) {
                return;
            }
            if (!isAllowedBridgeUrl(url)) {
                Log.w(TAG, "Blocked LLM bridge request to unsupported URL: " + url);
                deliverLlmResult(requestId, 0, "");
                return;
            }
            new Thread(new Runnable() {
                @Override
                public void run() {
                    executeLlmChat(requestId, url, apiKey, bodyJson);
                }
            }, "OOTD-Llm").start();
        }

        // 虚拟试穿图保存：接收 PNG 的 data URL（如 data:image/png;base64,....），
        // 解码后写入系统相册，返回是否成功。Android 10+ 用 MediaStore 免权限写入，
        // 更老的系统上返回 false，由页面提示用户。
        @JavascriptInterface
        public boolean saveImageToGallery(String dataUrl) {
            if (dataUrl == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                return false;
            }
            try {
                int comma = dataUrl.indexOf(',');
                String base64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
                byte[] png = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
                if (png.length == 0) {
                    return false;
                }
                ContentValues values = new ContentValues();
                values.put(
                        MediaStore.Images.Media.DISPLAY_NAME,
                        "ootd-tryon-" + System.currentTimeMillis() + ".png"
                );
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                values.put(
                        MediaStore.Images.Media.RELATIVE_PATH,
                        Environment.DIRECTORY_PICTURES + "/OOTD"
                );
                values.put(MediaStore.Images.Media.IS_PENDING, 1);
                Uri uri = getContentResolver().insert(
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                        values
                );
                if (uri == null) {
                    return false;
                }
                try (OutputStream output = getContentResolver().openOutputStream(uri)) {
                    if (output == null) {
                        return false;
                    }
                    output.write(png);
                }
                values.clear();
                values.put(MediaStore.Images.Media.IS_PENDING, 0);
                getContentResolver().update(uri, values, null, null);
                return true;
            } catch (Exception error) {
                Log.w(TAG, "Unable to save image to gallery", error);
                return false;
            }
        }
    }

    private static boolean isAllowedBridgeUrl(String value) {
        Uri uri = Uri.parse(value);
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        if ("https".equals(scheme)) {
            return true;
        }
        // 明文仅放行本机与模拟器宿主，便于联调自建 mock 服务，外网明文一律拒绝。
        return "http".equals(scheme)
                && ("10.0.2.2".equals(host) || "127.0.0.1".equals(host) || "localhost".equals(host));
    }

    private void launchCameraCapture() {
        Log.w(TAG, "launchCameraCapture entered; pending=" + pendingCameraRequestId);
        if (pendingCameraRequestId == null) {
            return;
        }
        try {
            // Request a camera-owned thumbnail instead of providing an output
            // MediaStore URI. On the API 34 AVD, Camera2 blocks while opening
            // a cross-app MediaStore target; the standard thumbnail contract
            // opens reliably and gives this clothing scan a 640px-class image.
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            // Calling resolveActivity can stall on this API 34 emulator while
            // its camera package initializes. Let startActivityForResult do
            // the resolution; ActivityNotFoundException is caught below.
            Log.w(TAG, "Opening system camera for OOTD capture");
            startActivityForResult(intent, REQUEST_CAMERA);
        } catch (Exception error) {
            Log.w(TAG, "Unable to open camera", error);
            finishCameraCapture("unable to open camera");
        }
    }

    private void finishCameraCapture(String error) {
        String requestId = pendingCameraRequestId;
        Uri uri = pendingCameraUri;
        pendingCameraRequestId = null;
        pendingCameraUri = null;
        if (uri != null) {
            try { getContentResolver().delete(uri, null, null); } catch (Exception ignored) { }
        }
        if (requestId != null) {
            deliverCameraResult(requestId, "", error);
        }
    }

    private File prepareShareableInstaller() throws IOException {
        File source = new File(getApplicationInfo().sourceDir);
        File directory = new File(getCacheDir(), "shared");
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("Unable to create app invite directory");
        }
        File destination = new File(directory, ShareProvider.APK_FILE);
        try (InputStream input = new FileInputStream(source);
             OutputStream output = new FileOutputStream(destination, false)) {
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) {
                output.write(buffer, 0, count);
            }
            output.flush();
        }
        return destination;
    }

    private String cameraDataUrl(Bitmap photo) {
        if (photo == null) return "";
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            photo.compress(Bitmap.CompressFormat.JPEG, 92, output);
            return "data:image/jpeg;base64," + android.util.Base64.encodeToString(output.toByteArray(), android.util.Base64.NO_WRAP);
        } catch (Exception error) {
            Log.w(TAG, "Unable to read captured photo", error);
            return "";
        }
    }

    private void deliverCameraResult(final String requestId, final String dataUrl, final String error) {
        if (requestId == null || webView == null) return;
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                String javascript = "window.__ootdCameraResult&&window.__ootdCameraResult("
                        + JSONObject.quote(requestId) + ","
                        + JSONObject.quote(dataUrl == null ? "" : dataUrl) + ","
                        + JSONObject.quote(error == null ? "" : error) + ");";
                webView.evaluateJavascript(javascript, null);
            }
        });
    }

    private void executeLlmChat(String requestId, String url, String apiKey, String bodyJson) {
        int status = 0;
        String body = "";
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestMethod("POST");
            // The first request on an emulator may need DNS, TLS and route
            // warm-up. Keep this aligned with the WebView-side ping timeout.
            connection.setConnectTimeout(25000);
            connection.setReadTimeout(60000);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("User-Agent", "OOTD-Android-Preview/0.1");
            connection.setRequestProperty("Authorization", "Bearer " + apiKey);
            byte[] payload = bodyJson.getBytes("UTF-8");
            connection.setFixedLengthStreamingMode(payload.length);
            OutputStream output = connection.getOutputStream();
            try {
                output.write(payload);
                output.flush();
            } finally {
                output.close();
            }
            status = connection.getResponseCode();
            InputStream stream = status >= 200 && status < 300
                    ? connection.getInputStream()
                    : connection.getErrorStream();
            body = readStream(stream);
            if (status < 200 || status >= 300) {
                Log.w(TAG, "LLM bridge HTTP " + status + " from " + new URL(url).getHost());
            }
        } catch (Exception error) {
            Log.w(TAG, "LLM bridge request failed", error);
            status = 0;
            if (error instanceof SocketTimeoutException) {
                body = "NETWORK_TIMEOUT";
            } else if (error instanceof UnknownHostException) {
                body = "NETWORK_DNS_FAILURE";
            } else if (error instanceof SSLException) {
                body = "NETWORK_TLS_FAILURE";
            } else {
                body = "NETWORK_FAILURE";
            }
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
        deliverLlmResult(requestId, status, body);
    }

    private void deliverLlmResult(final String requestId, final int status, final String body) {
        final String script = "window.__ootdLlmResult && window.__ootdLlmResult("
                + JSONObject.quote(requestId)
                + "," + status
                + "," + JSONObject.quote(body == null ? "" : body)
                + ")";
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (isFinishing() || webView == null) {
                    return;
                }
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private String readStream(InputStream stream) throws IOException {
        if (stream == null) {
            return "";
        }
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] chunk = new byte[8192];
        int read;
        try {
            while ((read = stream.read(chunk)) > 0) {
                buffer.write(chunk, 0, read);
            }
        } finally {
            stream.close();
        }
        return new String(buffer.toByteArray(), "UTF-8");
    }

    private WebResourceResponse openBundledAsset(Uri uri) {
        if (uri == null || !APP_HOST.equalsIgnoreCase(uri.getHost())) {
            return null;
        }

        String path = uri.getPath();
        if (path == null) {
            return notFoundResponse("Missing asset path");
        }

        String assetPath;
        if (path.startsWith("/assets/")) {
            // The entry document is addressed as /assets/www/index.html, while
            // Vite emits its compiled CSS/JS as /assets/<file>. Keep both URL
            // shapes inside the APK's assets/www tree.
            String bundledPath = path.substring("/assets/".length());
            assetPath = bundledPath.startsWith("www/")
                    ? bundledPath
                    : "www/assets/" + bundledPath;
        } else if (path.startsWith("/static/")) {
            assetPath = "www" + path;
        } else {
            return notFoundResponse("Unsupported asset path");
        }

        if (assetPath.isEmpty() || assetPath.contains("..")) {
            return notFoundResponse("Unsafe asset path");
        }

        try {
            InputStream stream = getAssets().open(assetPath);
            String mimeType = resolveMimeType(assetPath);
            String encoding = mimeType.startsWith("text/")
                    || "application/javascript".equals(mimeType)
                    || "application/json".equals(mimeType)
                    || "image/svg+xml".equals(mimeType)
                    ? "UTF-8"
                    : null;
            return new WebResourceResponse(mimeType, encoding, stream);
        } catch (IOException error) {
            Log.e(TAG, "Bundled asset missing: " + assetPath, error);
            return notFoundResponse("Bundled asset not found");
        }
    }

    private String resolveMimeType(String assetPath) {
        String extension = MimeTypeMap.getFileExtensionFromUrl(assetPath);
        String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        if (mimeType != null) {
            return mimeType;
        }
        if (assetPath.endsWith(".js") || assetPath.endsWith(".mjs")) {
            return "application/javascript";
        }
        if (assetPath.endsWith(".json")) {
            return "application/json";
        }
        if (assetPath.endsWith(".svg")) {
            return "image/svg+xml";
        }
        return "application/octet-stream";
    }

    private WebResourceResponse notFoundResponse(String message) {
        byte[] body;
        try {
            body = message.getBytes("UTF-8");
        } catch (Exception ignored) {
            body = new byte[0];
        }
        return new WebResourceResponse(
                "text/plain",
                "UTF-8",
                404,
                "Not Found",
                Collections.singletonMap("Cache-Control", "no-store"),
                new ByteArrayInputStream(body)
        );
    }

    private void verifyPageRendered(WebView view) {
        if (isFinishing() || view != webView) {
            return;
        }
        view.evaluateJavascript(
                "(function(){var app=document.getElementById('app');"
                        + "return !!(app&&app.childElementCount>0);})()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (!"true".equals(value)) {
                            Log.e(TAG, "The page finished loading but the app did not render.");
                            showStartupError("页面脚本未能启动");
                        }
                    }
                }
        );
    }

    private void showStartupError(String detail) {
        final String errorDetail = detail;
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (startupErrorShown || isFinishing()) {
                    return;
                }
                startupErrorShown = true;
                String webViewVersion = "未知";
                if (WebView.getCurrentWebViewPackage() != null) {
                    webViewVersion = WebView.getCurrentWebViewPackage().versionName;
                }
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("页面启动失败")
                        .setMessage(
                                errorDetail + "\n\nAndroid System WebView：" + webViewVersion
                                        + "\n请更新系统 WebView 后重试；也可连接电脑读取 OOTDPreview 日志。"
                        )
                        .setPositiveButton("重新加载", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                startupErrorShown = false;
                                webView.loadUrl(START_URL);
                            }
                        })
                        .setNegativeButton("关闭", null)
                        .show();
            }
        });
    }

    private void configureSystemBars() {
        Window window = getWindow();
        window.setStatusBarColor(Color.rgb(255, 252, 253));
        window.setNavigationBarColor(Color.rgb(255, 252, 253));
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        );
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CAMERA) {
            Log.w(TAG, "Camera result=" + resultCode);
            final String requestId = pendingCameraRequestId;
            pendingCameraRequestId = null;
            pendingCameraUri = null;
            if (requestId == null) return;
            if (resultCode != RESULT_OK) {
                deliverCameraResult(requestId, "", "camera capture cancelled");
                return;
            }
            final Bitmap photo = data == null ? null : (Bitmap) data.getParcelableExtra("data");
            new Thread(new Runnable() {
                @Override
                public void run() {
                    String dataUrl = cameraDataUrl(photo);
                    deliverCameraResult(requestId, dataUrl, dataUrl.length() == 0 ? "unable to read photo" : "");
                }
            }, "OOTD-Camera").start();
            return;
        }
        Log.i(TAG, "onActivityResult code=" + requestCode + " result=" + resultCode + " data=" + data);
        if (requestCode != REQUEST_FILES || fileCallback == null) {
            return;
        }
        Uri[] result = null;
        if (data != null) {
            if (data.getData() != null) {
                result = new Uri[] { data.getData() };
            } else if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                result = new Uri[count];
                for (int i = 0; i < count; i++) {
                    result[i] = data.getClipData().getItemAt(i).getUri();
                }
            }
        }
        Log.i(TAG, "FileChooser parsed uris=" + (result == null ? 0 : result.length)
                + (result == null ? "" : " first=" + result[0]));
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_LOCATION || pendingGeoCallback == null) {
            return;
        }
        boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        pendingGeoCallback.invoke(pendingGeoOrigin, granted, false);
        pendingGeoOrigin = null;
        pendingGeoCallback = null;
    }
}
