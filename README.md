# Taptap CLI

A lightning-fast command-line tool for deploying static HTML, CSS, and JavaScript projects to remote servers with zero configuration hassle.

## Description

Taptap CLI is designed to streamline the deployment process for front-end developers and students working on static web projects. With a single command, you can deploy your HTML, CSS, and JavaScript files to a remote server, making it perfect for showcasing projects, assignments, or prototypes.

The tool automatically detects your project structure, filters relevant files, packages them securely, and deploys them via API - all while keeping your workflow clean and efficient.

## Installation

Install Taptap CLI globally using npm:

```bash
npm install -g taptap-cli
```

## ⚠️ Important Notice

**Sites deployed without a support token will be automatically taken down after 120 days.** 

If you need longer hosting or want to avoid the 120-day limit, please contact support to obtain a token for extended hosting.

## Quick Start

Navigate to your project directory and deploy:

```bash
cd my-awesome-project
taptap --deploy
```

## Usage Examples

### Initialize a New Project
```bash
taptap --init
```

### Basic Deployment
```bash
taptap --deploy
```

### Preview Site Locally Before Deploying
```bash
taptap --preview
```

### View Past Deployments
```bash
taptap --deploy-list
```

### View Local Deployment Logs
```bash
taptap --logs
```

### Delete a Deployment
```bash
taptap --delete
```

### Open the Latest Deployment in Browser
```bash
taptap --open
```

### Check for CLI Update
```bash
taptap --update
```

### Display CLI Version
```bash
taptap --version
```

### About the CLI
```bash
taptap --about
```

### Get Help
```bash
taptap --help
```

## Command-Line Flags

| Flag            | Description                                                   |
|-----------------|---------------------------------------------------------------|
| `--init`        | Initialize a new project with template files                  |
| `--deploy`      | Deploy current folder to live URL                             |
| `--deploy-list` | Show past deployments from server                             |
| `--logs`        | Show local deployment logs                                     |
| `--preview`     | Preview site locally before deploy                            |
| `--delete`      | Delete a deployment                                           |
| `--open`        | Open the deployed site in default browser                     |
| `--update`      | Check for CLI updates                                         |
| `--version`     | Show CLI version                                              |
| `--about`       | Show information about this CLI tool                          |
| `--help`        | Show help message                                             |


## File Inclusion & Exclusion Rules

### ✅ Included Files
- `.html` files (e.g., `index.html`)
- `.css` files (stylesheets)
- `.js` files (JavaScript)
- Image files (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`)
- Video files (`.mp4`, `.webm`, `.ogg`)
- Font files (`.woff`, `.woff2`, `.ttf`, `.otf`)
- JSON files (`.json`)
- Media assets necessary for front-end rendering

### ❌ Excluded Files
- Hidden files and directories (starting with `.`)
- `node_modules/` directory
- `.git/` directory
- Log files (`.log`, `.logs`)
- Archive files (`.zip`, `.rar`, `.tar`, etc.)
- Markdown files (`.md`, `.markdown`)
- Files with malformed names (e.g., `index.html,style.css`)
- Any files that don't match the allowed or recognized extensions


## Deployment Process

### What Happens During Deployment

1. **Project Detection**: Scans current directory for `index.html` file
2. **File Filtering**: Collects only `.html`, `.css`, and `.js` files based on inclusion rules
3. **Temporary Packaging**: Creates a `tempdeploy/` folder and copies filtered files
4. **Compression**: Zips the temporary folder for efficient transfer
5. **API Upload**: Sends the zip file to the deployment server
6. **URL Generation**: Receives the live site URL from the server
7. **Cleanup**: Removes temporary folder and zip file

### After Deployment

- Your site is live at the provided URL
- All temporary files are automatically cleaned up
- You receive confirmation of successful deployment
- **Sites remain active for 120 days** (unless you have a support token)

## Site Management

### Viewing Deployments from Server
Use `taptap --deploy-list` to fetch all your past deployments from the remote server. You'll see each site's URL and inspection link.

### Viewing Local Deployment Logs
Use `taptap --logs` to review deployment history stored locally on your system.

### Previewing Before Deploy
Use `taptap --preview` to launch a local development server and test your site before deploying it live.

### Deleting Deployments
Use `taptap --delete` to permanently remove a deployed site from the server.

### Opening the Latest Deployment
Use `taptap --open` to instantly open your most recent deployment in the default browser.

## Error Handling

Taptap CLI provides clear error messages for common issues:

- Missing `index.html` file in current directory
- Network connectivity problems
- Server-side deployment errors
- File permission issues

## Development Requirements

Your project should have:
- An `index.html` file in the root directory
- Valid HTML, CSS, and/or JavaScript files
- Proper file naming (avoid special characters and malformed names)

## Example Project Structure

```
my-project/
├── index.html ✅ Included
├── style.css ✅ Included
├── script.js ✅ Included
├── about.html ✅ Included
├── image.png ✅ Included
├── video.mp4 ✅ Included
├── font.woff2 ✅ Included
├── data.json ✅ Included
├── README.md ❌ Excluded
├── package.json ❌ Excluded
├── .gitignore ❌ Excluded
└── node_modules/ ❌ Excluded
```

## Troubleshooting

### Common Issues

**No index.html found**: Ensure you're in the correct project directory with an `index.html` file.

**Deployment failed**: Check your internet connection and try again.

**Site went down**: If your site is no longer accessible after 120 days, you'll need to redeploy or contact support for a token.

## Extended Hosting

For sites that need to stay live longer than 120 days, contact support to obtain a token. With a support token, your deployments will have extended hosting without the automatic takedown.

## Author

**Anurag Anand**  
Student at LPU Punjab  
Passionate about making deployment simple and accessible for developers.

## License

ISC License - Free to use, modify, and distribute.

## Future Improvements

### Planned Features
- **Custom File Extensions**: Support for additional file types (images, fonts, etc.)
- **Environment Variables**: Store tokens securely in config files
- **Multiple Server Support**: Deploy to different environments (staging, production)
- **Deployment History**: Enhanced tracking and management of deployments
- **Custom Domain Mapping**: Connect deployed sites to personal domains
- **Real-time Logs**: Live deployment progress with detailed status updates
- **Rollback Functionality**: Easily revert to previous deployments
- **Team Collaboration**: Share projects with team members
- **Template System**: Pre-built templates for common project types
- **Performance Analytics**: Basic site performance metrics post-deployment

### Community Contributions
We welcome contributions! Future versions may include:
- Plugin system for custom preprocessing
- Integration with popular frameworks
- Automatic SSL certificate generation
- CDN optimization for static assets

---

**Happy Deploying! 🚀**

For issues, feature requests, or to obtain extended hosting tokens, please contact our support team.