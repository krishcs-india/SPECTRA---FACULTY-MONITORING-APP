package in.edu.college.kalyani;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "AppFileOpener")
public class AppFileOpenerPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String filePath = call.getString("filePath");
        String mimeType = call.getString("mimeType", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String title = call.getString("title", "Open with");

        if (filePath == null || filePath.isEmpty()) {
            call.reject("File path cannot be null or empty");
            return;
        }

        try {
            Uri contentUri;
            if (filePath.startsWith("content://")) {
                contentUri = Uri.parse(filePath);
            } else if (filePath.startsWith("file://")) {
                File file = new File(Uri.parse(filePath).getPath());
                contentUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    file
                );
            } else {
                File file = new File(filePath);
                contentUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    file
                );
            }

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(contentUri, mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooser = Intent.createChooser(intent, title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            getContext().startActivity(chooser);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not open file with viewer app: " + e.getMessage(), e);
        }
    }
}
