package id.gordenmalang.management;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.print.PrintJob;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "GMAndroid")
public class GMAndroidPlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Map<PrintJob, WebView> activePrintViews = new HashMap<>();

    @PluginMethod
    public void openExternalUrl(PluginCall call) {
        String url = call.getString("url", "");
        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http"))) {
            call.reject("Tautan harus menggunakan HTTP atau HTTPS.");
            return;
        }

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException error) {
            call.reject("Tidak ada aplikasi yang dapat membuka tautan ini.", error);
        }
    }

    @PluginMethod
    public void printHtml(PluginCall call) {
        String html = call.getString("html", "");
        if (html.trim().isEmpty()) {
            call.reject("Dokumen cetak kosong.");
            return;
        }

        String jobName = call.getString("jobName", "Gorden Malang");
        if (jobName == null || jobName.trim().isEmpty()) jobName = "Gorden Malang";
        final String safeJobName = jobName.trim();
        final String printHtml = html;

        getActivity().runOnUiThread(() -> {
            WebView printView = new WebView(getContext());
            printView.setBackgroundColor(android.graphics.Color.WHITE);
            printView.getSettings().setJavaScriptEnabled(false);
            printView.getSettings().setAllowFileAccess(true);
            printView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    try {
                        PrintManager printManager = (PrintManager) getContext()
                                .getSystemService(Context.PRINT_SERVICE);
                        if (printManager == null) {
                            printView.destroy();
                            call.reject("Layanan cetak Android tidak tersedia.");
                            return;
                        }

                        PrintJob job = printManager.print(
                                safeJobName,
                                printView.createPrintDocumentAdapter(safeJobName),
                                null
                        );
                        activePrintViews.put(job, printView);
                        call.resolve(new JSObject().put("jobName", safeJobName));
                        releasePrintViewWhenFinished(job);
                    } catch (Exception error) {
                        printView.destroy();
                        call.reject("Tidak dapat membuka dialog cetak Android.", error);
                    }
                }
            });
            printView.loadDataWithBaseURL(
                    "file:///android_asset/public/",
                    printHtml,
                    "text/html",
                    "UTF-8",
                    null
            );
        });
    }

    private void releasePrintViewWhenFinished(PrintJob job) {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (job.isCompleted() || job.isCancelled() || job.isFailed()) {
                    WebView printView = activePrintViews.remove(job);
                    if (printView != null) printView.destroy();
                } else {
                    handler.postDelayed(this, 2000);
                }
            }
        }, 2000);
    }
}
