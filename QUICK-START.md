# 🚀 Obfusi-Bob Quick Start Guide

## ✅ Application is Running!

Your Obfusi-Bob application is now live and fully functional at:
- **Login:** http://localhost:3000/login-functional.html
- **Dashboard:** http://localhost:3000/dashboard-functional.html

---

## 🔐 Step 1: Login

1. Open your browser and go to: **http://localhost:3000/login-functional.html**

2. Use these demo credentials:
   - **Username:** `demo`
   - **Password:** `demo123`

3. Click "Sign In"

4. You'll be automatically redirected to the dashboard

---

## 📊 Step 2: Analyze Code

Once logged in, you'll see the **Analyze Code** page:

### Option A: Upload a File
1. Click the file drop zone or drag and drop a `.ll` file
2. The file content will appear in the text area
3. Click "Analyze Code"

### Option B: Paste Code
1. Paste your LLVM IR code directly into the text area
2. Example code you can use:
```llvm
define i32 @main() {
entry:
  %result = add i32 5, 3
  ret i32 %result
}

define i32 @add(i32 %a, i32 %b) {
entry:
  %sum = add i32 %a, %b
  ret i32 %sum
}
```
3. Click "Analyze Code"

### What You'll See:
- **Functions Count:** Number of functions detected
- **Instructions Count:** Total instructions in the code
- **Complexity Score:** Calculated complexity
- **Loops Found:** Number of loops detected
- **Function Details:** List of all functions with their properties

---

## 🔒 Step 3: Obfuscate Code

1. Click "Obfuscate" in the sidebar

2. Paste your LLVM IR code in the text area

3. Select obfuscation techniques:
   - ✅ Control Flow Flattening (recommended)
   - ✅ Bogus Control Flow
   - ✅ String Encryption

4. Click "Apply Obfuscation"

5. View the obfuscated code in the results section

6. Click "Download" to save the obfuscated code as a `.ll` file

---

## 💡 Step 4: Get AI Recommendations

1. First, analyze some code (Step 2)

2. Click "AI Recommendations" in the sidebar

3. Click "Get Recommendations"

4. You'll see AI-powered suggestions including:
   - **Technique Name:** Recommended obfuscation method
   - **Confidence Score:** How confident the AI is
   - **Effectiveness:** Expected effectiveness percentage
   - **Overhead:** Performance impact estimate
   - **Complexity:** Implementation difficulty
   - **Reasoning:** Why this technique is recommended

---

## 📜 Step 5: View History

1. Click "History" in the sidebar

2. See all your past operations:
   - Analysis operations
   - Obfuscation operations
   - Timestamps
   - Results

---

## 🎯 Key Features

### ✅ File Upload & Drag-and-Drop
- Supports `.ll` (LLVM IR) files
- Drag and drop directly onto the upload zone
- Or click to browse files

### ✅ Real-Time Analysis
- Instant code parsing
- Function detection
- Complexity calculation
- Loop and conditional detection

### ✅ Multiple Obfuscation Techniques
- Control Flow Flattening
- Bogus Control Flow
- String Encryption
- Combine multiple techniques

### ✅ AI-Powered Recommendations
- Analyzes your code structure
- Suggests best obfuscation techniques
- Provides confidence scores
- Explains reasoning

### ✅ Export Capabilities
- Download obfuscated code
- Save as `.ll` files
- Ready to use with LLVM toolchain

---

## 🔧 API Endpoints (For Advanced Users)

All endpoints require authentication token in header:
```
Authorization: Bearer <your-token>
```

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "demo",
  "password": "demo123",
  "rememberMe": false
}
```

### Analyze Code
```http
POST /api/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "irContent": "define i32 @main() { ret i32 0 }"
}
```

### Obfuscate Code
```http
POST /api/obfuscate
Authorization: Bearer <token>
Content-Type: application/json

{
  "irContent": "define i32 @main() { ret i32 0 }",
  "passes": ["flatten", "bogus", "encrypt-strings"]
}
```

### Get Recommendations
```http
POST /api/recommendations
Authorization: Bearer <token>
Content-Type: application/json

{
  "analysis": { /* analysis result object */ }
}
```

---

## 📝 Sample LLVM IR Code

Here are some sample codes you can try:

### Simple Function
```llvm
define i32 @main() {
entry:
  ret i32 0
}
```

### Function with Loops
```llvm
define i32 @sum(i32 %n) {
entry:
  br label %loop

loop:
  %i = phi i32 [ 0, %entry ], [ %next, %loop ]
  %acc = phi i32 [ 0, %entry ], [ %sum, %loop ]
  %sum = add i32 %acc, %i
  %next = add i32 %i, 1
  %cond = icmp slt i32 %next, %n
  br i1 %cond, label %loop, label %exit

exit:
  ret i32 %acc
}
```

### Function with Conditionals
```llvm
define i32 @max(i32 %a, i32 %b) {
entry:
  %cmp = icmp sgt i32 %a, %b
  br i1 %cmp, label %if.then, label %if.else

if.then:
  ret i32 %a

if.else:
  ret i32 %b
}
```

---

## 🐛 Troubleshooting

### Issue: Can't login
**Solution:** Make sure you're using the correct credentials:
- Username: `demo`
- Password: `demo123`

### Issue: API errors
**Solution:** Check that the server is running:
```bash
# Should see the server banner in terminal
node api-server-standalone.js
```

### Issue: Page not loading
**Solution:** Make sure you're accessing the functional pages:
- Login: `http://localhost:3000/login-functional.html`
- Dashboard: `http://localhost:3000/dashboard-functional.html`

### Issue: Token expired
**Solution:** Just logout and login again. Tokens expire after 24 hours.

---

## 💻 Development Mode

### View Console Logs
Open browser DevTools (F12) to see:
- API calls
- Authentication status
- Error messages
- Debug information

### Test API Directly
Use tools like Postman or curl:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Analyze (replace <token> with actual token)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"irContent":"define i32 @main() { ret i32 0 }"}'
```

---

## 🎓 Tips & Best Practices

1. **Start Simple:** Begin with simple LLVM IR code to understand the analysis

2. **Try Different Techniques:** Experiment with different obfuscation combinations

3. **Check Recommendations:** Always get AI recommendations before obfuscating

4. **Download Results:** Save your obfuscated code for later use

5. **Monitor Complexity:** Watch how complexity increases with obfuscation

6. **Use History:** Review past operations to track your work

---

## 📚 Next Steps

1. **Explore All Features:** Try every page in the dashboard

2. **Test with Real Code:** Use actual LLVM IR from your projects

3. **Compare Techniques:** See how different obfuscation methods affect your code

4. **Export Reports:** Use the export features to generate reports

5. **Integrate with LLVM:** Use the obfuscated code with your LLVM toolchain

---

## 🏆 Ready for Demo!

Your Obfusi-Bob application is now fully functional and ready for:
- ✅ Live demonstrations
- ✅ Hackathon presentations
- ✅ Code analysis and obfuscation
- ✅ AI-powered recommendations
- ✅ Export and reporting

**Start exploring at:** http://localhost:3000/login-functional.html

---

## 📞 Need Help?

- Check the browser console (F12) for errors
- Review the terminal where the server is running
- All operations are logged for debugging

**Happy Obfuscating! 🛡️**