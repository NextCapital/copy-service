# copy-service

### pre-commit hook

Place in `.git/hooks/pre-commit`. Ensure this file has execute permissions.

To add execute permissions: `chmod +x .git/hooks/pre-commit`
```
#!/usr/bin/env bash

./lint-js.sh
```
