
package com.example.idphotopro // Hãy đổi đúng theo package name của bạn

import android.Manifest
import android.net.Uri
import android.os.Bundle
import android.webkit.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    // Bộ nhận diện quyền (Camera & Lưu trữ)
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Xử lý khi người dùng cho phép hoặc từ chối
    }

    // Bộ chọn file từ thư viện ảnh
    private val getFileLauncher = registerForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        filePathCallback?.onReceiveValue(uris.toTypedArray())
        filePathCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Tạo WebView bằng code hoặc thông qua layout XML
        webView = WebView(this)
        setContentView(webView)

        // Xin quyền ngay khi mở app
        requestPermissionLauncher.launch(arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        ))

        setupWebView()

        // CÁCH 1: Chạy từ link Web (Khuyên dùng vì React ESM chạy tốt nhất trên HTTPS)
        webView.loadUrl("https://id-photo-pro.vercel.app") 

        // CÁCH 2: Chạy từ thư mục assets (Nếu bạn đã build code React thành HTML/JS thuần)
        // webView.loadUrl("file:///android_asset/index.html")
    }

    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true // Cho phép chạy JavaScript
            domStorageEnabled = true // Lưu trữ dữ liệu web
            allowFileAccess = true 
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            
            // Giả lập trình duyệt di động để web hiển thị đúng
            userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) Chrome/91.0.4472.124"
        }

        webView.webChromeClient = object : WebChromeClient() {
            // Cấp quyền camera cho WebView
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    request.grant(request.resources)
                }
            }

            // Mở trình chọn ảnh của Android khi bấm nút "Tải ảnh lên"
            override fun onShowFileChooser(
                webView: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?
            ): Boolean {
                filePathCallback = callback
                getFileLauncher.launch("image/*")
                return true
            }
        }

        // Đảm bảo các link không bị mở bằng trình duyệt ngoài
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
