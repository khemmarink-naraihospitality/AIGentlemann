# Product Requirement Document (PRD) - AI Video & Image Generator Web App

## 1. Executive Summary
แอปพลิเคชันเว็บแบบ Responsive (เน้นการใช้งานบนอุปกรณ์พกพาเป็นหลัก - Mobile-First) ที่ช่วยให้ผู้ใช้สามารถอัปโหลดรูปภาพพื้นหลัง (Background), รูปภาพบุคคล (Person), พร้อมกรอกคำอธิบาย (Description) และคำพูด (Speak) เพื่อนำข้อมูลเหล่านี้ไปส่งต่อให้ AI ประมวลผลและสร้างออกมาเป็นภาพใหม่ (Generate Image) หรือวิดีโอ (Generate Video) พร้อมระบบบันทึกประวัติการสร้าง (History) และหน้าตั้งค่า API Key จาก Google AI Studio

## 2. User Personas & Goals
* **Target User:** Content Creator, นักการตลาดออนไลน์, หรือผู้ใช้งานทั่วไปที่ต้องการสร้างสื่อมัลติมีเดียแบบเร่งด่วนผ่านสมาร์ทโฟน
* **User Goal:** สามารถสร้างภาพหรือวิดีโอจากวัตถุดิบที่มีอยู่ (ภาพ + ข้อความ) ได้ง่ายๆ ภายในไม่กี่คลิกผ่านมือถือ และสามารถย้อนดูหรือดาวน์โหลดไฟล์เก่าได้

## 3. Scope & Key Features

### 3.1 Mobile-First Responsive User Interface (UI)
* การออกแบบ layout ทั้งหมดต้องรองรับหน้าจอมือถือ (Viewport ตั้งแต่ 320px ขึ้นไป) เป็นอันดับแรก
* ใช้ UI Component ที่เป็นมิตรต่อการใช้นิ้วสัมผัส (Touch-friendly elements, Large buttons)

### 3.2 Input Form Component (No Required Fields)
ฟอร์มรับข้อมูลเข้าที่ผู้ใช้จะกรอกหรือไม่กรอกก็ได้ (Optional ทั้งหมด):
1.  **Image Background:** ช่องอัปโหลดไฟล์ภาพสำหรับใช้เป็นฉากหลัง (รองรับ .jpg, .png)
2.  **Image Person:** ช่องอัปโหลดไฟล์ภาพบุคคล/ตัวละคร (รองรับ .jpg, .png)
3.  **Text Description:** ช่องกรอกข้อความอธิบายบริบทหรือสไตล์ที่ต้องการ (Textarea)
4.  **Text Speak:** ช่องกรอกบทพูด หรือข้อความที่ต้องการให้ปรากฏ/พากย์ (Textarea)

### 3.3 Action Buttons
* **Button A: Generate Image** -> ส่งข้อมูลไปประมวลผลเพื่อสร้างภาพนิ่ง
* **Button B: Generate Video** -> ส่งข้อมูลไปประมวลผลเพื่อสร้างวิดีโอ

### 3.4 History Management
* ส่วนแสดงรายการไฟล์ (ภาพ/วิดีโอ) ที่เคยสร้างสำเร็จ
* แสดงผลในรูปแบบ Grid Layout (การ์ดแสดงรูป Preview หรือวิดีโอขนาดเล็ก)
* มีปุ่มสำหรับ **Download** ไฟล์ลงเครื่อง หรือ **Delete** เพื่อลบออกจากประวัติ

### 3.5 Settings Page (Google AI Studio Integration)
* ช่องสำหรับกรอกและบันทึก **Google AI Studio API Key**
* ระบบตรวจสอบสถานะ API Key (Valid/Invalid)
* จัดเก็บ Key อย่างปลอดภัยใน LocalStorage ของเบราว์เซอร์ผู้ใช้ (Client-Side Encryption/Storage) ไม่ผ่าน Server กลางเพื่อความเป็นส่วนตัว

---

## 4. Non-Functional Requirements
* **Performance:** หน้าเว็บต้องโหลดเร็ว และประมวลผลสถานะการ Generate (Loading Spinner) อย่างชัดเจนเนื่องจากงาน AI ใช้เวลาประมวลผล (Long-running tasks)
* **Security:** ห้ามบันทึก API Key ของผู้ใช้ลงในฐานข้อมูลส่วนกลางเด็ดขาด ให้ใช้ LocalStorage ภายในเครื่องของผู้ใช้เท่านั้น
* **UX/UI:** มี Feedback บอกผู้ใช้เสมอเมื่อกดปุ่ม เช่น "กำลังสร้างภาพ...", "สร้างสำเร็จ!"

## 5. Future Roadmap
* รองรับการเลือกโมเดลที่ละเอียดขึ้นในหน้า Setting (เช่น Gemini 2.5 Flash vs Pro)
* ระบบตัดต่อหรือปรับตำแหน่ง Image Person บน Image Background ก่อนกด Generate
