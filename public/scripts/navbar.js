// document.getElementById('bell').addEventListener('click', async () => {
//     const dropdown = document.querySelector('.notification-dropdown');
//     dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  
//     // โหลดข้อมูลทุกครั้งที่คลิก
//     const response = await fetch('/notifications');
//     const notifications = await response.json();
    
//     const container = document.querySelector('.notification-dropdown');
//     container.innerHTML = notifications.map(noti => `
//       <div class="notification-item">
//         <span>${noti.service_name}</span>
//         <small>${new Date(noti.service_date).toLocaleString()}</small>
//       </div>
//     `).join('');
//   });

document.getElementById('bell').addEventListener('click', async () => {
    const dropdown = document.querySelector('.notification-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });