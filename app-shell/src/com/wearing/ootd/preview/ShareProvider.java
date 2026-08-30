package com.wearing.ootd.preview;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Read-only, grant-only provider for the installer attached to an app invite.
 * The actual APK is copied into cache immediately before sharing, so no other
 * internal application files can be addressed through this provider.
 */
public final class ShareProvider extends ContentProvider {
    public static final String AUTHORITY = "com.wearing.ootd.preview.share";
    public static final String APK_FILE = "ootd-what-to-wear.apk";

    @Override public boolean onCreate() { return true; }
    @Override public String getType(Uri uri) { return "application/vnd.android.package-archive"; }
    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) { return null; }
    @Override public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
    @Override public Uri insert(Uri uri, ContentValues values) { return null; }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (!APK_FILE.equals(uri.getLastPathSegment()) || getContext() == null) {
            throw new FileNotFoundException("No shared file at " + uri);
        }
        File apk = new File(new File(getContext().getCacheDir(), "shared"), APK_FILE);
        return ParcelFileDescriptor.open(apk, ParcelFileDescriptor.MODE_READ_ONLY);
    }
}
