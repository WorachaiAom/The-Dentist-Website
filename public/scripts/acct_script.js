let currentField = '';      // เก็บว่าแก้ไข field ไหนอยู่
let tempData = {};          // เก็บค่าชั่วคราวที่แก้ไข

// เปิด Pop-up ให้กรอกข้อมูลใหม่
function openEditPopup(field) {
    currentField = field;

    const placeholderMap = {
        username: 'กรอกชื่อผู้ใช้ใหม่',
        email: 'กรอกอีเมลใหม่',
        password: 'กรอกรหัสผ่านใหม่'
    };

    document.getElementById('editInput').placeholder = placeholderMap[field] || '';
    document.getElementById('editInput').value = '';  // เคลียร์ค่าเดิมออก
    document.getElementById('editPopup').classList.add('active');
}

// ปิด Pop-up กรอกข้อมูล
function closeEditPopup() {
    document.getElementById('editPopup').classList.remove('active');
}

// บันทึกข้อมูลที่แก้ไข (ยังไม่ยืนยัน)
function saveEdit() {
    const newValue = document.getElementById('editInput').value;

    if (newValue.trim() === '') {
        alert('กรุณากรอกข้อมูลก่อน');
        return;
    }

    // อัปเดตหน้าจอชั่วคราว + เก็บลง tempData
    if (currentField === 'username') {
        document.getElementById('usernameDisplay').innerText = newValue;
    } else if (currentField === 'email') {
        document.getElementById('emailDisplay').innerText = newValue;
    } else if (currentField === 'password') {
        document.getElementById('passwordDisplay').innerText = '********';  // ซ่อนรหัสผ่าน
    }

    tempData[currentField] = newValue;
    closeEditPopup();
}

// เปิด Pop-up ยืนยันการเปลี่ยนแปลง
function confirmChanges() {
    let summaryText = 'คุณได้ทำการเปลี่ยนแปลงดังนี้:\n';
    let hasChanges = false;

    if (tempData.username) {
        summaryText += `- ชื่อผู้ใช้: ${tempData.username}\n`;
        hasChanges = true;
    }
    if (tempData.email) {
        summaryText += `- อีเมล: ${tempData.email}\n`;
        hasChanges = true;
    }
    if (tempData.password) {
        summaryText += `- รหัสผ่าน: (เปลี่ยนใหม่แล้ว)\n`;
        hasChanges = true;
    }

    if (!hasChanges) {
        alert('คุณยังไม่ได้เปลี่ยนแปลงข้อมูลใดๆ');
        return;
    }

    document.getElementById('summaryText').innerText = summaryText;
    document.getElementById('confirmPopup').classList.add('active');
}

// ปิด Pop-up ยืนยันการเปลี่ยนแปลง
function closeConfirmPopup() {
    document.getElementById('confirmPopup').classList.remove('active');
}

// กดปุ่มยืนยันขั้นสุดท้าย (สามารถส่ง tempData ไปเซิร์ฟเวอร์ที่นี่ได้)
function finalConfirm() {
    console.log('ส่งข้อมูล:', tempData);
    alert('บันทึกข้อมูลเรียบร้อย!');
    document.getElementById('confirmPopup').classList.remove('active');

    // ตรงนี้สามารถใส่ fetch หรือ AJAX ส่ง tempData ไปอัปเดตในฐานข้อมูลได้
    // เช่น fetch('/update-profile', { method: 'POST', body: JSON.stringify(tempData), headers: {'Content-Type': 'application/json'} })

    // เคลียร์ tempData หลังจากยืนยันแล้ว
    tempData = {};
}
