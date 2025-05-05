// based on "expo-widgets"

const { withDangerousMod, AndroidConfig } = require('@expo/config-plugins')
const path = require('node:path')
const fs = require('node:fs')

const withSourceFiles = (
    config,
    options,
) => {
    return withDangerousMod(config, [
        'android',
        async newConfig => {
            const { modRequest } = newConfig

            const projectRoot = modRequest.projectRoot
            const platformRoot = modRequest.platformProjectRoot
            const widgetFolderPath = path.join(projectRoot, options.src)
            const packageName = AndroidConfig.Package.getPackage(config)

            if (!packageName) {
                throw new Error(`ExpoWidgets:: app.(ts/json) must provide a value for android.package.`)
            }

            copyResourceFiles(widgetFolderPath, platformRoot)

            const sourceFiles = copySourceFiles(widgetFolderPath, platformRoot, packageName)

            modifySourceFiles(options.distPlaceholder, sourceFiles, packageName)

            return newConfig
        }
    ])
}

const copyResourceFiles = (widgetFolderPath, platformRoot) => {
    const resourcesFolder = path.join(widgetFolderPath, 'src/res')
    const destinationFolder = path.join(platformRoot, 'app/src/main/res')

    if (!fs.existsSync(resourcesFolder)) {
        console.log(`No resource 'res' folder found in the widget source directory ${widgetFolderPath}. No resource files copied over.`)

        return
    }

    console.log(`Copying resources from ${resourcesFolder} to ${destinationFolder}`)

    safeCopy(resourcesFolder, destinationFolder)
}

const safeCopy = (sourcePath, destinationPath) => {
    try {
        if (fs.lstatSync(sourcePath).isDirectory()) {
            if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath, { recursive: true })
            }
            for (const file of fs.readdirSync(sourcePath)) {
                safeCopy(
                    path.join(sourcePath, file),
                    path.join(destinationPath, file)
                )
            }
        } else {
            fs.copyFileSync(sourcePath, destinationPath)
        }
    } catch (error) {
        console.warn(error)
    }
}


const getSourceFileDestinationFolder = (packageName, widgetFolderPath, platformRoot) => {
    const packageNameAsPath = packageName?.replace(/\./g, '/')

    return path.join(platformRoot, 'app/src/main/java', packageNameAsPath)
}

function emptyDirSync(dir) {
    if (fs.existsSync(dir)) {
        for (const file of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, file)
            fs.rmSync(fullPath, { recursive: true, force: true })
        }
    }
}

const copySourceFiles = (
    widgetFolderPath,
    platformRoot,
    packageName,
) => {
    const originalSourceFolder = path.join(widgetFolderPath, 'src/main/java/package_name')
    const destinationFolder = getSourceFileDestinationFolder(packageName, widgetFolderPath, platformRoot)

    if (!fs.existsSync(destinationFolder)) {
        fs.mkdirSync(destinationFolder)
    }

    console.log(`Copying source files from ${originalSourceFolder} to ${destinationFolder}`)

    const paths = fs.readdirSync(originalSourceFolder)

    const sourceFiles = []

    for (const relativePath of paths) {
        const sourcePath = path.join(originalSourceFolder, relativePath)
        const destinationPath = path.join(destinationFolder, relativePath)

        if (fs.lstatSync(sourcePath).isDirectory()) {
            emptyDirSync(destinationPath)
            fs.cpSync(sourcePath, destinationPath, { recursive: true })
        }

        const file = path.basename(relativePath)

        if (file === 'Module.kt') {
            console.log('Module file skipped during source file copy.')

            continue
        }

        console.log(`Copying file ${sourcePath} to ${destinationPath}`)

        fs.copyFileSync(sourcePath, destinationPath)
        sourceFiles.push(destinationPath)
    }

    return sourceFiles
}

const escapeRegExp = str => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const replaceAll = (source, find, replace) => {
    return source.replace(new RegExp(escapeRegExp(find), 'g'), replace)
}

const modifySourceFiles = (distPlaceholder, sourceFiles, packageName) => {
    if (!distPlaceholder?.length) {
        console.log('No distPlaceholder set. Modification of source files not required.')

        return
    }
    else if (sourceFiles.length === 0) {
        console.log('No source files provided for modification.')

        return
    }

    console.log(`Modifying source files with placeholder ${distPlaceholder} to package ${packageName}`)

    const packageSearchStr = `package ${distPlaceholder}`
    const packageReplaceStr = `package ${packageName}`

    const importSearchStr = `import ${distPlaceholder}`
    const importReplaceStr = `import ${packageName}`

    for (const filePath of sourceFiles) {
        const contents = fs.readFileSync(filePath, { encoding: 'utf-8' })
        console.log(contents)

        const withModulesFixed = replaceAll(contents, packageSearchStr, packageReplaceStr)
        const withImportsFixed = replaceAll(withModulesFixed, importSearchStr, importReplaceStr)

        fs.writeFileSync(filePath, withImportsFixed)
    }
}

module.exports = withSourceFiles