# Standard Operating Procedure: Deploying Full-Stack Applications to cPanel

This is a generalized, standard operating procedure (SOP) for deploying full-stack or frontend-heavy web applications (such as React, Vue, or Vite projects) to a standard cPanel hosting environment.

> [!TIP]
> This guide is designed to be shared and reused across different projects and domains.

---

## Phase 1: Local Preparation & Building

Before touching the server, you must compile your source code into production-ready static assets. cPanel (specifically Apache or LiteSpeed web servers) expects plain HTML, CSS, and JavaScript files in the `public_html` directory, not raw React code.

1.  **Open your Terminal:** Navigate to the root folder of your project (where `package.json` is located).
2.  **Install Dependencies:** Ensure all packages are up-to-date.
    ```bash
    npm install
    ```
3.  **Build for Production:** Compile the code.
    ```bash
    npm run build
    ```
4.  **Package the Output:** A new folder (usually named `dist/` or `build/`) will be created. Compress the **contents** of this folder (not the folder itself) into a single zip archive, for example, `deploy.zip`.

---

## Phase 2: cPanel File Manager Setup

Now, we move to the hosting environment.

1.  **Access cPanel:** Log into your hosting provider's cPanel dashboard (typically `yourdomain.com/cpanel`).
2.  **Open File Manager:** Locate the "Files" section and click on the **File Manager** icon.

![File Manager Dashboard](file:///C:/Users/acer/.gemini/antigravity/brain/613b6001-1da5-46f4-9c39-9bde0035ea50/artifacts/cpanel_dashboard_mockup_1778062709891.png)

3.  **Navigate to Web Root:** On the left sidebar, click on **`public_html`**. This is the directory that serves content to the public internet.
4.  **Clean Up:** If this is a fresh deployment or you are replacing a broken site, it is highly recommended to select all existing files inside `public_html` and **Delete** them. 

> [!WARNING]
> Do not delete the `public_html` folder itself, only its contents. Ensure you show hidden files (Settings > Show Hidden Files) so you don't miss `.htaccess`.

---

## Phase 3: Upload and Extract

1.  **Upload the Archive:** With `public_html` open, click the **Upload** button in the top toolbar. This will open a new tab with a file drop zone.
2.  **Select File:** Drag and drop your `deploy.zip` file, or click "Select File" to upload it. Wait for the progress bar to reach 100% and turn green.

![Upload Interface](file:///C:/Users/acer/.gemini/antigravity/brain/613b6001-1da5-46f4-9c39-9bde0035ea50/artifacts/cpanel_upload_mockup_1778062725403.png)

3.  **Return to File Manager:** Go back to the File Manager tab and click the **Reload** button if the zip file isn't visible yet.
4.  **Extract:** Right-click the uploaded `deploy.zip` file (or select it and click **Extract** in the top toolbar). 
5.  **Confirm Path:** Ensure the extraction path is set to `/public_html` and click "Extract File(s)".

![Extracting the Zip](file:///C:/Users/acer/.gemini/antigravity/brain/613b6001-1da5-46f4-9c39-9bde0035ea50/artifacts/cpanel_extract_mockup_1778062740677.png)

> [!IMPORTANT]
> Once extracted, you should see your `index.html` file sitting directly inside `public_html`. If it extracted into a subfolder (e.g., `public_html/dist/index.html`), the site will not work. You must move the contents up one level.

---

## Phase 4: Verification & Cleanup

1.  **Test the Site:** Open a new browser tab and navigate to your domain name (e.g., `https://yourdomain.com`). Your application should load instantly.
2.  **Clean up:** Return to the File Manager and delete the `deploy.zip` file to save server storage space.

### Troubleshooting Routing (For React/Vite SPAs)

If you navigate to a subpage directly (e.g., `yourdomain.com/about`) and get a 404 error, your cPanel server needs routing instructions. Create an `.htaccess` file in `public_html` with the following code:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
