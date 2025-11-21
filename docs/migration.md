Here’s a **minimal migration guide** in Markdown format that documents the simpler branch‑only method (without `git filter-repo`). This is the cleanest approach when your work already lives in a dedicated branch like `v3-architecture`.

---

```markdown
# Minimal Branch Migration Guide

This guide explains how to move an existing branch (`v3-architecture`) into a new repository while preserving its commit history.  
Unlike subtree or folder extraction, this method does **not** require `git filter-repo` because the branch already contains the desired history.

---

## 1. Create a Bare Clone of the Old Repo
A bare clone copies all Git data (commits, branches, tags) without a working directory.

```bash
git clone --bare https://github.com/your-org/deep-session-v2.git deepsession-v3-bare.git
cd deepsession-v3-bare.git
```

---

## 2. Point to the New Remote Repository
Update the remote to the new GitHub repo you created:

```bash
git remote set-url origin https://github.com/your-org/deepsession-v3.git
git remote -v
# origin  https://github.com/your-org/deepsession-v3.git (fetch)
# origin  https://github.com/your-org/deepsession-v3.git (push)
```

---

## 3. Push Only the Target Branch
Push the branch you want (`v3-architecture`) into the new repo’s `main` branch:

```bash
git push origin v3-architecture:main
```

- This ensures only the commits from `v3-architecture` are transferred.
- Other branches remain in the old repo and are not pushed.

---

## 4. Clone the New Repo Normally
To get a working directory with files checked out:

```bash
cd ..
git clone https://github.com/your-org/deepsession-v3.git
cd deepsession-v3
```

---

## 5. Verify Commit History
Check that the new repo contains only the commits from `v3-architecture`:

```bash
git log --oneline --graph
```

---

## ✅ Summary
- **Bare clone** → copies all Git data.  
- **Set new remote** → points to the new repo.  
- **Selective push** → transfers only the desired branch (`v3-architecture`).  
- **Clone new repo** → get files and continue development.  

This method is sufficient when the branch is already isolated.  
Use `git filter-repo` only if you need to extract a folder, remove sensitive files, or rewrite history.
```

---

This version is leaner and easier to follow than the filter‑repo workflow, and it matches exactly what you did: bare clone → push branch → clone new repo.  

Would you like me to also add a **section on tagging** here, so the guide includes how to mark the split point (`v3-split` in old repo, `v3-origin` in new repo) for future traceability?