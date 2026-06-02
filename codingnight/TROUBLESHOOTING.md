# Troubleshooting Guide

## 🔧 Common Issues & Solutions

### Installation & Setup

#### Issue: npm install fails
**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules`: `rm -rf node_modules`
3. Delete lock file: `rm package-lock.json`
4. Reinstall: `npm install`

#### Issue: Port 3000 already in use
**Solutions:**
```bash
# Find process on port 3000
netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

#### Issue: TypeScript errors after install
**Solutions:**
```bash
# Rebuild TypeScript
npx tsc --noEmit

# Clear Next.js cache
rm -rf .next

# Run again
npm run dev
```

---

### Authentication Issues

#### Issue: "Password must contain..." message persists
**Solution:** Password must have:
- ✅ 8+ characters
- ✅ 1 Uppercase (A-Z)
- ✅ 1 Digit (0-9)
- ✅ 1 Special Character (!@#$%^&*)

**Example**: `MyPassword123!`

#### Issue: Login fails with correct credentials
**Solutions:**
1. **Check case sensitivity**: Passwords are case-sensitive
2. **Verify email**: Email must match signup email exactly
3. **Clear cookies**: Open DevTools > Application > Cookies > Delete auth token
4. **Check localStorage**: 
   - Open DevTools > Application > Local Storage
   - Look for `users` key
   - Verify user exists with correct email

#### Issue: Redirected to login on every page refresh
**Solution:** Check localStorage persistence:
```javascript
// In browser console
localStorage.getItem('auth-store') // Should show auth data
localStorage.getItem('users') // Should show user list
```

If empty, Zustand isn't persisting. Clear all and login again.

---

### Resume Builder Issues

#### Issue: ATS Score shows 0
**Solutions:**
1. **Fill sections properly**: Empty sections reduce score
2. **Add more details**: 
   - Longer experience descriptions = higher score
   - More skills = higher score
   - Complete all sections
3. **Check calculations**:
   ```javascript
   // In console, test:
   const resume = { content: { ... } };
   console.log(calculateATSScore(resume));
   ```

#### Issue: Download button doesn't work
**Solutions:**
1. Check browser console for errors
2. Verify resume has `personalInfo.fullName`
3. Allow downloads in browser permissions
4. Try different browser
5. Check firewall/antivirus settings

#### Issue: Multiple resumes not showing
**Solutions:**
1. **Check storage**:
   ```javascript
   localStorage.getItem('resume-store')
   ```
2. **Verify resume data structure**:
   ```javascript
   const store = JSON.parse(localStorage.getItem('resume-store'));
   console.log(store.state.resumes);
   ```
3. **Clear and recreate**:
   ```javascript
   localStorage.removeItem('resume-store');
   // Refresh page and recreate resumes
   ```

---

### Practice Section Issues

#### Issue: Questions not generating
**Solutions:**
1. **Select a resume first**: Dropdown must have value
2. **Check resume data**: Resume must have content populated
3. **Check network tab**:
   - DevTools > Network
   - Check `/api/questions` request
   - Look for errors in response
4. **Verify API route exists**:
   ```bash
   curl http://localhost:3000/api/questions -X POST
   ```

#### Issue: Questions appear empty or malformed
**Solutions:**
1. **Check API response**:
   ```javascript
   // In console during request
   const res = await fetch('/api/questions', { ... });
   const data = await res.json();
   console.log(data);
   ```
2. **Verify resume structure matches schema**
3. **Check browser console for parse errors**

#### Issue: Answer tracking not working
**Solutions:**
1. **Check localStorage**:
   ```javascript
   localStorage.getItem('qa-store')
   ```
2. **Verify state updates**:
   - Type in answer
   - Open DevTools
   - Check that answer is saved

---

### Study Mode Issues

#### Issue: Study plan not generating
**Solutions:**
1. **Provide detailed job description**:
   - Include specific skills required
   - List experience levels
   - Add key responsibilities
2. **Ensure resume is populated**:
   - Must have skills section
   - Must have experience
   - Must have education
3. **Check network tab** for API errors
4. **Look at console** for error messages

#### Issue: No skill gaps identified
**Solutions:**
1. **Make JD more specific**:
   - Include exact skill names
   - List technical requirements
   - Specify seniority level
2. **Ensure resume has skills**:
   - Add relevant skills section
   - Use common industry terms
3. **Try different JD**:
   - Paste full job posting
   - Include skills section

#### Issue: Resources show as "Example Resource"
**Solutions:**
1. This is expected for demo
2. In production, integrate real APIs:
   - YouTube API for videos
   - Udemy API for courses
   - Medium API for articles
3. Update API endpoints:
   ```typescript
   // In src/app/api/study-plan/route.ts
   // Replace generateResources() with real API calls
   ```

---

### UI/Styling Issues

#### Issue: Styles not applying
**Solutions:**
1. **CSS Module import**:
   ```typescript
   // Correct
   import styles from './Component.module.css';
   
   // Then use: className={styles.className}
   ```
2. **Clear build cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```
3. **Check class names** match CSS module exactly (case-sensitive)
4. **Hard refresh browser**: Ctrl+Shift+R or Cmd+Shift+R

#### Issue: Colors look different than expected
**Solutions:**
1. **Check CSS variables**:
   ```css
   /* In src/app/globals.css */
   :root {
     --color-primary: #2563eb; /* Change here */
   }
   ```
2. **Verify browser color profile**:
   - Some browsers render colors differently
   - Try different browser
3. **Check for OS dark mode** affecting colors

#### Issue: Layout broken on mobile
**Solutions:**
1. **Test responsive design**:
   - DevTools > Toggle Device Toolbar
   - Test at 375px width
2. **Check media queries** in CSS files
3. **Verify CSS media breakpoints**:
   ```css
   @media (max-width: 768px) { ... }
   ```

---

### API Issues

#### Issue: API returns 404
**Solutions:**
1. **Verify route file exists**:
   ```bash
   # Check these files exist:
   src/app/api/questions/route.ts
   src/app/api/study-plan/route.ts
   src/app/api/resumes/route.ts
   src/app/api/auth/login/route.ts
   src/app/api/auth/signup/route.ts
   ```
2. **Check file naming**: Must be `route.ts` not `index.ts`
3. **Restart dev server**: Kill and restart with `npm run dev`

#### Issue: API returns 401 Unauthorized
**Solutions:**
1. **Include x-user-id header**:
   ```typescript
   headers: { 'x-user-id': userId }
   ```
2. **Verify JWT token** exists in store
3. **Check token expiration**:
   ```javascript
   const token = useAuthStore.getState().token;
   console.log(token);
   ```

#### Issue: API returns 500 Server Error
**Solutions:**
1. **Check server logs**:
   - Look at terminal running `npm run dev`
   - Find error stack trace
2. **Verify request data**:
   ```javascript
   // Log request body before sending
   console.log(JSON.stringify(body));
   ```
3. **Check API implementation**:
   - Review route handler
   - Add console.logs to debug
4. **Test with curl**:
   ```bash
   curl -X POST http://localhost:3000/api/questions \
     -H "Content-Type: application/json" \
     -d '{"resumeId":"test","resume":{...}}'
   ```

#### Issue: CORS errors
**Solutions:**
1. **Ensure API is local** (not calling external API without CORS setup)
2. **Check environment** - running on same domain
3. **For external APIs**, setup CORS headers:
   ```typescript
   // In API route
   headers: {
     'Access-Control-Allow-Origin': '*',
     'Content-Type': 'application/json',
   }
   ```

---

### Performance Issues

#### Issue: Application is slow
**Solutions:**
1. **Clear localStorage**:
   ```javascript
   localStorage.clear();
   ```
2. **Check for memory leaks** in DevTools
3. **Disable browser extensions** temporarily
4. **Check large resumesdata**:
   - Break into smaller pieces
   - Use pagination if needed

#### Issue: Questions take too long to generate
**Solutions:**
1. This is normal for first generation
2. Check network speed:
   - DevTools > Network > See request time
3. For production, optimize API:
   - Add caching
   - Use database instead of in-memory

---

### Development Issues

#### Issue: Changes not reflecting in browser
**Solutions:**
1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear .next cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```
3. **Check file saved**: Ensure file is actually saved in editor
4. **Restart dev server**: Kill and restart `npm run dev`

#### Issue: TypeScript errors but app still runs
**Solutions:**
1. **For development**, errors are warnings
2. **Fix before production**:
   ```bash
   npx tsc --noEmit
   ```
3. **Check errors**:
   - Open file in editor
   - Look at "Problems" tab
   - Add `as Type` if needed for type assertions

---

### Production Issues

#### Issue: Application crashes after deployment
**Solutions:**
1. **Check environment variables**:
   - Verify `.env.production` has all keys
   - Check JWT_SECRET is set
2. **View production logs**:
   - Vercel: Dashboard > Logs
   - Other providers: Check logs section
3. **Test locally** with production environment:
   ```bash
   NODE_ENV=production npm run build
   NODE_ENV=production npm run start
   ```

#### Issue: Database connection fails
**Solutions:**
1. **Verify DATABASE_URL** in `.env.production`
2. **Check database is running** and accessible
3. **Verify firewall** allows connections
4. **Test connection string**:
   ```bash
   # Use database client to test
   psql $DATABASE_URL -c "SELECT 1"
   ```

---

### Getting More Help

#### Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('debug', 'true');
// Reload page to see debug logs
```

#### Check Logs
```bash
# Terminal logs
npm run dev 2>&1 | tee app.log

# Browser console logs
DevTools > Console > Filter for errors
```

#### File Issues
```bash
# Check file exists and is readable
ls -la src/app/api/questions/route.ts

# Check permissions
chmod 644 src/app/api/questions/route.ts
```

---

### Emergency Reset

If everything seems broken:

```bash
# 1. Clear all caches
npm cache clean --force
rm -rf node_modules .next

# 2. Clear local storage
# Open DevTools > Application > Storage > Clear All

# 3. Reinstall
npm install

# 4. Rebuild
npm run build

# 5. Start fresh
npm run dev
```

---

## 📋 Debugging Checklist

Before reporting an issue:

- [ ] Checked browser console for errors
- [ ] Cleared browser cache and localStorage
- [ ] Restarted development server
- [ ] Verified all required files exist
- [ ] Checked environment variables
- [ ] Tested in different browser
- [ ] Verified internet connection
- [ ] Reviewed API response in Network tab
- [ ] Checked terminal logs for errors
- [ ] Verified data structure matches types

---

**Most issues are resolved by restarting the dev server or clearing cache!** 🚀
