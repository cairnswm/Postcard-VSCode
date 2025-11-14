# 📮 Postcard - Friendly API Testing for VS Code

**Postcard** is a user-friendly VS Code extension that makes API testing simple and organized. Test your REST APIs directly within VS Code with an intuitive interface that keeps your tests organized in folders and files.

## ✨ What does Postcard do?

Postcard transforms VS Code into a powerful API testing tool, similar to Postman but integrated right into your development environment. You can:

- **🗂️ Organize API tests** in folders and files for better project management
- **🚀 Test REST APIs** with all HTTP methods (GET, POST, PUT, DELETE, etc.)
- **📋 Manage request headers and body** with support for JSON, form data, XML, and more
- **📊 View detailed responses** including status codes, headers, and response body
- **💾 Save tests per project** - each workspace maintains its own test suite
- **👥 Share with team** by committing test configurations to version control

## 🚀 Installation

### Option 1: From VS Code Marketplace (Coming Soon)
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Postcard"
4. Click **Install**

### Option 2: Install from Release
1. Download the latest `.vsix` file from [GitHub Releases](https://github.com/cairnswm/Postcard-VSCode/releases)
2. Open VS Code
3. Press `Ctrl+Shift+P` and type "Install from VSIX"
4. Select the downloaded `.vsix` file

## � How to Use Postcard

### Getting Started
1. **Open a workspace** in VS Code (Postcard requires a workspace folder)
2. Look for the **Postcard icon** (🌐) in the Activity Bar (left sidebar)
3. Click to open the **API Explorer** panel
4. Start creating folders and API tests!

### 📁 Creating Folders
1. Click the **folder icon** (➕📁) in the Explorer toolbar
2. Enter a folder name (e.g., "User API", "Products")
3. Click on the folder to set a **base URL** (e.g., `https://api.example.com`)

### 📄 Creating API Tests
1. Click the **file icon** (➕📄) in the Explorer toolbar  
2. Enter a test name (e.g., "Get User Profile", "Create Product")
3. Click on the test to configure:
   - **HTTP Method**: GET, POST, PUT, DELETE, etc.
   - **URL**: Complete URL or path relative to folder's base URL
   - **Headers**: Authorization, Content-Type, custom headers
   - **Body**: JSON data, form data, or other content types
4. Click **"Test API"** to run the test
5. View results in the **Test Results** panel

### 🔍 Viewing Results
After running a test, the **Test Results** panel shows:
- ✅ **Response Status**: HTTP status code and message
- ⏱️ **Response Time**: How long the request took
- 📋 **Response Headers**: All response headers
- 📄 **Response Body**: Formatted response data (JSON, HTML, etc.)
- 🔍 **Request Details**: What was sent (for debugging)

### 💾 Saving and Sharing Tests
- **Auto-save**: All tests are automatically saved to `.postcard/tests.json` in your workspace
- **Version Control**: 
  - **Share with team**: Commit `.postcard/` folder to include tests in your project
  - **Keep private**: Add `.postcard/` to `.gitignore` for personal tests only

## 🛠️ Tips and Tricks

### Organizing Your Tests
- **Group by feature**: Create folders like "Authentication", "User Management", "Products"
- **Use descriptive names**: "POST /login" is better than "Test 1"
- **Set base URLs**: Configure base URLs on folders to avoid repeating common URL parts

### Working with Different APIs
- **REST APIs**: Use appropriate HTTP methods (GET for reading, POST for creating, etc.)
- **Authentication**: Add Authorization headers with Bearer tokens, API keys, etc.
- **Content Types**: Use JSON for REST APIs, form data for traditional web forms

### Keyboard Shortcuts
- `Ctrl+Shift+P` → "Postcard: Add Folder" - Quick folder creation
- `Ctrl+Shift+P` → "Postcard: Add File" - Quick test creation
- `Ctrl+Shift+P` → "Postcard: Clear Results" - Clear the results panel

## 🤝 Need Help?

- **📝 Issues**: Report bugs or request features on [GitHub Issues](https://github.com/cairnswm/Postcard-VSCode/issues)
- **💬 Discussions**: Ask questions on [GitHub Discussions](https://github.com/cairnswm/Postcard-VSCode/discussions)
- **⭐ Star the repo**: If you find Postcard useful, give it a star on GitHub!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Not open for Contributions
