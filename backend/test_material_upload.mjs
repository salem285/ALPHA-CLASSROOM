import assert from 'node:assert';

const API_BASE = 'http://localhost:4000/api/v1';

async function testMaterialUpload() {
  console.log('=== Testing Course Material Upload in Instructor Portal ===');

  // Step 1: Login as Instructor
  console.log('1. Logging in as instructor@alphacoding.com...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'instructor@alphacoding.com',
      password: 'Alpha@2026!',
    }),
  });

  if (!loginRes.ok) {
    const errBody = await loginRes.text();
    throw new Error(`Login failed with status ${loginRes.status}: ${errBody}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  assert(token, 'Access token should be returned');
  console.log('  ✅ Instructor authenticated successfully.');

  // Step 2: Get or Create Instructor Course
  console.log('2. Fetching instructor courses...');
  const coursesRes = await fetch(`${API_BASE}/courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(coursesRes.ok, 'Failed to fetch courses');
  const courses = await coursesRes.json();

  let targetCourse = courses.find((c) => c.instructorId === loginData.user.id || c.instructor?.id === loginData.user.id);
  if (!targetCourse) {
    console.log('  Creating a test course for instructor...');
    const createCourseRes = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Full Stack Architecture Masterclass',
        description: 'Advanced full-stack development patterns',
      }),
    });
    assert(createCourseRes.ok, 'Failed to create test course');
    targetCourse = await createCourseRes.json();
  }
  const courseId = targetCourse.id;
  console.log(`  ✅ Using Course: "${targetCourse.title}" (${courseId})`);

  // Step 3: Test Upload with Title, Description, and File
  console.log('3. Uploading Course Material (PDF with title & description)...');
  const pdfBlob = new Blob(['%PDF-1.4 dummy syllabus content for testing upload'], { type: 'application/pdf' });
  const form1 = new FormData();
  form1.append('title', 'Advanced System Architecture Syllabus');
  form1.append('description', 'Official curriculum guidelines and schedule for term 2026.');
  form1.append('file', pdfBlob, 'architecture_syllabus.pdf');

  const upload1Res = await fetch(`${API_BASE}/courses/${courseId}/materials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // NOTE: Do not set Content-Type header manually - fetch appends boundary automatically
    },
    body: form1,
  });

  if (!upload1Res.ok) {
    const errBody = await upload1Res.text();
    throw new Error(`Material upload failed (${upload1Res.status}): ${errBody}`);
  }

  assert.strictEqual(upload1Res.status, 201, 'Expected HTTP 201 Created');
  const mat1 = await upload1Res.json();
  console.log('  Upload response:', mat1);
  assert(mat1.id, 'Uploaded material must have an ID');
  assert.strictEqual(mat1.title, 'Advanced System Architecture Syllabus');
  assert.strictEqual(mat1.description, 'Official curriculum guidelines and schedule for term 2026.');
  assert.strictEqual(mat1.fileType, 'PDF');
  assert(mat1.fileUrl, 'Uploaded material must have a fileUrl');
  console.log('  ✅ Material #1 uploaded successfully with HTTP 201 Created.');

  // Step 4: Test Upload with Empty Description (Optional string handling)
  console.log('4. Uploading Course Material with empty description (ZIP archive)...');
  const zipBlob = new Blob(['PK\x03\x04 dummy zip binary content'], { type: 'application/zip' });
  const form2 = new FormData();
  form2.append('title', 'Starter Template & Utilities');
  form2.append('description', '');
  form2.append('file', zipBlob, 'starter_template.zip');

  const upload2Res = await fetch(`${API_BASE}/courses/${courseId}/materials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form2,
  });

  if (!upload2Res.ok) {
    const errBody = await upload2Res.text();
    throw new Error(`Second upload failed (${upload2Res.status}): ${errBody}`);
  }

  assert.strictEqual(upload2Res.status, 201, 'Expected HTTP 201 Created');
  const mat2 = await upload2Res.json();
  assert(mat2.id, 'Uploaded material must have an ID');
  assert.strictEqual(mat2.title, 'Starter Template & Utilities');
  assert.strictEqual(mat2.fileType, 'ZIP');
  assert.strictEqual(mat2.description, null, 'Empty description should be normalized to null');
  console.log('  ✅ Material #2 uploaded successfully with HTTP 201 Created.');

  // Step 5: Verify GET /courses/:courseId/materials lists both items
  console.log('5. Querying course materials list...');
  const listRes = await fetch(`${API_BASE}/courses/${courseId}/materials`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(listRes.ok, 'Failed to fetch materials list');
  const materialsList = await listRes.json();
  const ids = materialsList.map((m) => m.id);
  assert(ids.includes(mat1.id), 'Material #1 must be present in course materials');
  assert(ids.includes(mat2.id), 'Material #2 must be present in course materials');
  console.log(`  ✅ Materials list verified with ${materialsList.length} total items.`);

  // Step 6: Delete the test materials
  console.log('6. Cleaning up uploaded test materials...');
  const del1 = await fetch(`${API_BASE}/materials/${mat1.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(del1.ok, 'Failed to delete material 1');

  const del2 = await fetch(`${API_BASE}/materials/${mat2.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(del2.ok, 'Failed to delete material 2');
  console.log('  ✅ Test materials deleted successfully.');

  console.log('=== ALL MATERIAL UPLOAD VERIFICATIONS PASSED (HTTP 201 CREATED) ===');
}

testMaterialUpload().catch((err) => {
  console.error('❌ Material Upload Test Failed:', err);
  process.exit(1);
});
