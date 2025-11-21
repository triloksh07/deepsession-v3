Here’s a **Markdown reference guide** you can keep in your repo for future migrations. It documents the exact process we followed to split out the `v3-architecture` branch into a clean new repository with preserved commit history.

---

```markdown
# Migrating a Branch to a New Repository with Full History

This document records the steps taken to extract the `v3-architecture` branch from the original repository and move it into a new repository (`deepsession-v3`) while preserving its commit history.

---

## 1. Create a Bare Clone of the Original Repo
A bare clone contains only Git data (commits, branches, tags) without a working directory.

```bash
git clone --bare https://github.com/your-org/deep-session-v2.git deepsession-v3-bare.git
cd deepsession-v3-bare.git
```

---

## 2. Filter the Repository to Keep Only `v3-architecture`
Use `git-filter-repo` to rewrite history so only commits from the target branch remain.

```bash
git filter-repo --refs v3-architecture --force
```

- `--refs v3-architecture` → keeps only the history of that branch  
- `--force` → required if filter-repo has already been run once

---

## 3. Clean Up Dangling Branches
After filtering, other branch names may still exist as refs. Remove them so only `v3-architecture` remains:

```bash
git for-each-ref --format='%(refname)' refs/heads/ \
  | grep -v 'v3-architecture' \
  | xargs -r -n1 git update-ref -d
```

Verify:
```bash
git branch
# Output: v3-architecture
```

---

## 4. Point to the New Remote Repository
Update the remote to the new GitHub repo:

```bash
git remote set-url origin https://github.com/triloksh07/deepsession-v3.git
git remote -v
# origin  https://github.com/triloksh07/deepsession-v3.git (fetch)
# origin  https://github.com/triloksh07/deepsession-v3.git (push)
```

---

## 5. Push the Branch to the New Repo
Push the filtered branch as the `main` branch in the new repo:

```bash
git push origin v3-architecture:main
```

---

## 6. Clone the New Repo to Work Normally
Finally, clone the new repo to get a working directory with files checked out:

```bash
cd ..
git clone https://github.com/triloksh07/deepsession-v3.git
cd deepsession-v3
```

---

## 7. Verify Commit History
Check that the history matches the original `v3-architecture` branch:

```bash
git log --oneline --graph
```

You should see only the commits from `v3-architecture` (e.g., 52 commits in this case).

---

## ✅ Summary
- **Bare clone** → copies all Git data  
- **Filter-repo** → isolates the target branch’s history  
- **Cleanup with `for-each-ref`** → removes dangling refs  
- **Push to new remote** → establishes the new repo with clean history  
- **Clone new repo** → get files and continue development  

This ensures the new repository (`deepsession-v3`) contains a **clean commit history of the `v3-architecture` branch** from its inception, independent of the old repo.
```

---

This `.md` file can live in your new repo under something like `docs/migration-guide.md` so future contributors understand exactly how v3 was split out.  

Would you like me to also add a **section on alternative methods** (like `git subtree split`) in case you ever need to extract a folder instead of a branch?