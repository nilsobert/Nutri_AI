# How to Use Self-Signed Certificates with NutriAI

Since you are using a self-signed certificate for your backend, mobile devices will reject the connection by default with a "Network request failed" error.

**IMPORTANT:** The certificate MUST match the domain name (`pangolin.7cc.xyz`). If your certificate was generated for `localhost`, it will fail on the device even if you trust it, because of a "Hostname Mismatch".

## 1. Install the Certificate on iOS Simulator

1.  Drag and drop the **new** `cert.pem` file onto the iOS Simulator window.
2.  A dialog will appear asking if you want to install the profile. Click **Allow**.
3.  Go to **Settings** > **General** > **VPN & Device Management** (or **Profiles**).
4.  Select the profile for "pangolin.7cc.xyz" (or NutriAI Dev) and click **Install**.
5.  **Crucial Step:** Go to **Settings** > **General** > **About** > **Certificate Trust Settings**.
6.  Under "Enable full trust for root certificates", toggle the switch for your certificate to **ON**.

## 2. Install on Android Emulator

1.  Push the certificate to the device:
    ```bash
    adb push cert.pem /sdcard/Download/
    ```
2.  On the emulator, go to **Settings** > **Security** > **Encryption & credentials** > **Install a certificate** > **CA certificate**.
3.  You might see a warning. Tap **Install anyway**.
4.  Navigate to the `Download` folder and select your certificate file.
5.  Give it a name and tap **OK**.

## 3. Physical Devices

### iOS
1.  Email the certificate to yourself or host it on a simple HTTP server.
2.  Open the file in Safari.
3.  Follow the same steps as the Simulator (Install Profile -> Enable Full Trust).

### Android
1.  Transfer the file to your phone (USB, Email, Drive).
2.  Go to **Settings** and search for "Certificate".
3.  Select **Install a certificate** > **CA certificate**.
4.  Select the file and install it.

## Troubleshooting

-   **"Network request failed"**:
    1.  Check if the certificate is trusted in "Certificate Trust Settings" (iOS).
    2.  Check if the certificate Common Name (CN) or SAN matches the domain `pangolin.7cc.xyz`.
-   **Domain Resolution**: Ensure `pangolin.7cc.xyz` resolves to an IP address accessible from the phone.
