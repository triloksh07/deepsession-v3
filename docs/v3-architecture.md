## DeepSession - v3 architecture

```md
app/
├── (auth)/             <-- For login/signup pages
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
│
├── (authed)/           <-- main app lives here
│   ├── layout.tsx      <-- [note]
│   ├── dashboard/
│   │   └── page.tsx    <-- ()
│   ├── sessions/
│   │   └── page.tsx    <-- ()
│   ├── goals/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   └── export/
│       └── page.tsx
│
├── layout.tsx          <-- Root layout (ThemeProvider, Toaster, etc.)
└── page.tsx            <-- The new "Home" page (e.g., marketing or redirect)
```
#### note: **(authed)/layout now handles auth guards and wraps children with DashboardProvider as a client component**