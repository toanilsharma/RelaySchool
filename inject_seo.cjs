const { Project, SyntaxKind } = require("ts-morph");
const fs = require('fs');

async function main() {
    const project = new Project();
    project.addSourceFilesAtPaths("pages/**/*.tsx");
    
    const files = project.getSourceFiles();
    
    for (const sourceFile of files) {
        const fileName = sourceFile.getBaseName();
        // Skip if SEO already imported
        if (sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue().includes('SEO'))) {
            continue;
        }

        const title = fileName.replace('.tsx', '').replace(/([A-Z])/g, ' $1').trim();
        const lowerUrl = fileName.replace('.tsx', '').toLowerCase();
        const seoTag = `<SEO title="${title}" description="Interactive Power System simulation and engineering tool: ${title}." url="/${lowerUrl}" />\n`;

        sourceFile.addImportDeclaration({
            defaultImport: 'SEO',
            moduleSpecifier: '../components/SEO'
        });

        const defaultExport = sourceFile.getDefaultExportSymbol();
        if (!defaultExport) {
            console.log('No default export in', fileName);
            continue;
        }

        let componentDecl = null;
        const decls = defaultExport.getDeclarations();
        if (decls.length > 0) {
            const decl = decls[0];
            if (decl.isKind(SyntaxKind.ExportAssignment)) {
                const expr = decl.getExpression();
                const name = expr.getText();
                const vDecl = sourceFile.getVariableDeclaration(name);
                if (vDecl) {
                    componentDecl = vDecl.getInitializerIfKind(SyntaxKind.ArrowFunction) || 
                                    vDecl.getInitializerIfKind(SyntaxKind.FunctionExpression);
                } else {
                    const fDecl = sourceFile.getFunction(name);
                    if (fDecl) componentDecl = fDecl;
                }
            } else if (decl.isKind(SyntaxKind.FunctionDeclaration)) {
                componentDecl = decl;
            }
        }

        if (!componentDecl) {
            console.log('Could not find component function for', fileName);
            continue;
        }

        // Find the top-level return statement in the component body
        const body = componentDecl.getBody();
        if (body && body.isKind(SyntaxKind.Block)) {
            const returnStatement = body.getStatements().find(s => s.isKind(SyntaxKind.ReturnStatement));
            if (returnStatement) {
                const expr = returnStatement.getExpression();
                if (expr && (expr.isKind(SyntaxKind.ParenthesizedExpression) || expr.isKind(SyntaxKind.JsxElement) || expr.isKind(SyntaxKind.JsxFragment))) {
                    let jsxElement = expr;
                    if (expr.isKind(SyntaxKind.ParenthesizedExpression)) {
                        jsxElement = expr.getExpression();
                    }
                    
                    if (jsxElement.isKind(SyntaxKind.JsxElement)) {
                        const opening = jsxElement.getOpeningElement();
                        // Instead of AST manipulation of JSX which is tricky in ts-morph, 
                        // we can replace the text of the opening element safely
                        const pos = opening.getEnd();
                        const fullText = sourceFile.getFullText();
                        sourceFile.replaceWithText(fullText.slice(0, pos) + '\n' + seoTag + fullText.slice(pos));
                        console.log('Injected SEO into', fileName);
                    } else if (jsxElement.isKind(SyntaxKind.JsxFragment)) {
                        const opening = jsxElement.getOpeningFragment();
                        const pos = opening.getEnd();
                        const fullText = sourceFile.getFullText();
                        sourceFile.replaceWithText(fullText.slice(0, pos) + '\n' + seoTag + fullText.slice(pos));
                        console.log('Injected SEO into (Fragment)', fileName);
                    }
                }
            }
        }
    }
    await project.save();
    console.log('Done.');
}
main();
