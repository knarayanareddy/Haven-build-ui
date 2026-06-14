#!/usr/bin/env python3
import os
import re
import sys

def main():
    repo = "."
    functions_dir = os.path.join(repo, "supabase", "functions")
    if not os.path.isdir(functions_dir):
        print(f"ERROR: Not a Haven-build repo at {repo}")
        sys.exit(1)

    print("=== HAVEN Security Python Bulk Migration ===")

    primary_fns = {
        "fn-scam-pipeline", "fn-transaction-intercept", "fn-right-to-erasure",
        "fn-onboarding", "fn-emergency-profile", "fn-scam-coaching", "fn-voice-pipeline"
    }

    count = 0
    for item in os.listdir(functions_dir):
        if not item.startswith("fn-") or item in primary_fns:
            continue
        
        index_path = os.path.join(functions_dir, item, "index.ts")
        if not os.path.isfile(index_path):
            continue

        print(f"  Migrating {item}...", end="")
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Save backup
        with open(index_path + ".bak", "w", encoding="utf-8") as f:
            f.write(content)

        # 1. CORS headers replacement
        content = re.sub(r'headers:\s*cors\s*}', 'headers: corsHeaders(req) }', content)
        content = re.sub(r'headers:\s*cors\s*,', 'headers: corsHeaders(req),', content)

        # 2. json response with req parameter
        content = re.sub(r'return\s+json\(result\.body,\s*result\.status\s*\?\?\s*200\)', 'return json(result.body, result.status ?? 200, req)', content)
        content = re.sub(r'return\s+json\(\{\s*error:\s*String\(\(e\s+as\s+Error\)\.message\s*\?\?\s*e\)\s*\}\s*,\s*400\)', 'return json({ error: safeErrorMessage(e) }, 400, req)', content)
        content = re.sub(r'return\s+json\(\{\s*error:\s*String\(e\.message\s*\?\?\s*e\)\s*\}\s*,\s*400\)', 'return json({ error: safeErrorMessage(e) }, 400, req)', content)
        content = re.sub(r'return\s+json\(\{\s*error:\s*String\(e\)\s*\}\s*,\s*400\)', 'return json({ error: safeErrorMessage(e) }, 400, req)', content)
        content = re.sub(r'return\s+json\(\{\s*error:\s*String\(\(e\s+as\s+Error\)\.message\)\s*\}\s*,\s*400\)', 'return json({ error: safeErrorMessage(e) }, 400, req)', content)

        # 3. Request body parsing
        content = re.sub(r'const\s+body\s*=\s*await\s+req\.json\(\);', 'const body = await readJsonBody(req) as Record<string, unknown>;', content)

        # 4. Error mapping replacement inside general catch blocks
        content = re.sub(r'String\(\(e\s+as\s+Error\)\.message\s*\?\?\s*e\)', 'safeErrorMessage(e)', content)
        content = re.sub(r'String\(e\.message\s*\?\?\s*e\)', 'safeErrorMessage(e)', content)
        content = re.sub(r'String\(e\)', 'safeErrorMessage(e)', content)

        # 5. Handle imports from "../_shared/core.ts"
        # Find first line containing the core.ts import
        lines = content.splitlines()
        imported_symbols = set()
        import_line_idx = -1
        for idx, line in enumerate(lines):
            if 'from "../_shared/core.ts"' in line or 'from \'../_shared/core.ts\'' in line:
                import_line_idx = idx
                # Extract currently imported symbols
                match = re.search(r'import\s*\{\s*(.*?)\s*\}\s*from', line)
                if match:
                    imported_symbols = {sym.strip() for sym in match.group(1).split(",")}
                break

        if import_line_idx != -1:
            need_imports = []
            if "corsHeaders" in content and "corsHeaders" not in imported_symbols:
                need_imports.append("corsHeaders")
            if "readJsonBody" in content and "readJsonBody" not in imported_symbols:
                need_imports.append("readJsonBody")
            if "safeErrorMessage" in content and "safeErrorMessage" not in imported_symbols:
                need_imports.append("safeErrorMessage")

            # Remove old 'cors' if 'corsHeaders' is imported and 'cors' is no longer in use
            if "corsHeaders" in need_imports and "cors" in imported_symbols and "cors" not in content:
                imported_symbols.discard("cors")

            if need_imports:
                for sym in need_imports:
                    imported_symbols.add(sym)
                
                # Reconstruct import line
                sorted_syms = sorted(list(imported_symbols))
                lines[import_line_idx] = f'import {{ {", ".join(sorted_syms)} }} from "../_shared/core.ts";'
                content = "\n".join(lines)

        with open(index_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(" done")
        count += 1

    print(f"=== Migration complete. Patched {count} files. ===")

if __name__ == "__main__":
    main()
