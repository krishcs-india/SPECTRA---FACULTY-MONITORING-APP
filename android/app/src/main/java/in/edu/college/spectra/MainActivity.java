package in.edu.college.spectra;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppFileOpenerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
