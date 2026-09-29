# Plan: Separate Jobseekers from Users Index

## Goal
- Create new `Jobseekers/Index.jsx` page showing only `job_seeker` role users
- Modify original `Users/Index.jsx` to exclude `job_seeker` role users
- Both pages use existing `UserController` methods: `index()` and `jobseekers()`

## Steps

### 1. Create Jobseekers Index Page
- Copy `Users/Index.jsx` → `Jobseekers/Index.jsx`
- Remove role filter (hardcoded to job_seeker)
- Update route references to `backend.users.jobseekers`
- Update bulk action routes to use jobseekers endpoints
- Keep same UI/permissions structure

### 2. Modify Original Users Index
- Add filter to exclude `job_seeker` role in the query
- Can be done in controller `index()` method or in frontend
- Controller approach is cleaner - add `whereDoesntHave('roles', slug='job_seeker')`

### 3. Verify Routes Exist
- Check `routes/web.php` for `backend.users.jobseekers` route
- Ensure `UserController@jobseekers` is mapped

### 4. Test Both Pages
- Users Index: shows all roles EXCEPT job_seeker
- Jobseekers Index: shows ONLY job_seeker role