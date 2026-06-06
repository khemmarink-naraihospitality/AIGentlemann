# Technical Context & Architecture Document

เอกสารฉบับนี้อธิบายถึงโครงสร้างทางเทคนิค สภาพแวดล้อม และสถาปัตยกรรมของแอปพลิเคชัน เพื่อให้ AI Agent หรือนักพัฒนาเข้าใจบริบทของระบบ

## 1. Technology Stack Selection

### Frontend (Client-Side)
* **Framework:** Next.js (App Router) หรือ React + Vite (เลือกตามความเหมาะสม แต่แนะนำ React + Vite สำหรับ Single Page App ที่เน้น Client-side คล่องตัวสูง)
* **Styling:** Tailwind CSS (เนื่องจากมี Utility-first classes ที่ช่วยให้เขียน Mobile-First Responsive ได้ง่ายมากด้วย prefix `sm:`, `md:`)
* **State Management:** React Context API หรือ Zustand (สำหรับจัดการสถานะ API Key และ History)
* **Icons:** Lucide React (สำหรับไอคอนดาวน์โหลด, ตั้งค่า, อัปโหลด)

### Backend / API Layer
* **Architecture:** Serverless Edge Functions (Next.js API Routes) หรือติดต่อแบบ Client-side Direct (หากตั้งค่า CORS ถูกต้อง)
* *หมายเหตุ:* เพื่อความปลอดภัยของ API Key แนะนำให้ทำ Proxy API Route สั้นๆ ในแอปเพื่อส่งต่อไปยัง Google AI Studio ป้องกันการหลุดของ Key ใน Network Tab ของ Browser ผู้ใช้

### Database / Storage (Client-side focus)
* **History & Settings Storage:** `IndexedDB` (ผ่าน Library เช่น `localForage` หรือ `Dexie.js`) หรือ `LocalStorage` สำหรับเก็บประวัติไฟล์ (Base64 หรือ Object URLs) และ API Key
* *ข้อควรระวัง:* เนื่องจากไฟล์ภาพและวิดีโอมีขนาดใหญ่ การเก็บใน LocalStorage โดยตรงในรูปแบบ Base64 อาจทำให้เต็มเร็ว (จำกัดที่ ~5MB) จึงแนะนำให้ใช้ **IndexedDB** ซึ่งรองรับข้อมูลขนาดใหญ่กว่ามาก หรือบันทึกเป็นประวัติแบบ Cloud Storage ในอนาคต

---

## 2. System Architecture & Data Flow

### 2.1 API Key Workflow
1. ผู้ใช้เข้าหน้า Setting -> กรอก Google AI Studio API Key -> ระบบบันทึกเข้า Browser LocalStorage
2. เมื่อมีการเรียกใช้งาน ตัวแอปจะดึง Key นี้มาแนบใน Header ของการ Request

### 2.2 Generation Workflow
1. ผู้ใช้กรอกฟอร์ม (อัปโหลดภาพ หรือกรอก Text - ข้อมูลใดๆ ก็ได้)
2. เมื่อกด "Generate Image":
   * ระบบจะแปลงภาพที่อัปโหลดเป็น Base64 (ถ้ามี)
   * รวมข้อมูลทั้งหมดเป็น Prompt (Multimodal Prompt)
   * ยิงไปยัง Endpoint ของ Google AI Studio (หรือผ่าน Proxy Route ของเรา)
3. เมื่อได้รับผลลัพธ์ (Image URL / Base64) -> นำผลลัพธ์ไปแสดงผลบนหน้าจอ -> บันทึกลงระบบ History (IndexedDB)

---

## 3. UI/UX Layout Design (Mobile-First)

* **Header:** ชื่อแอปพลิเคชันด้านซ้าย ปุ่มไอคอนฟันเฟือง (Settings) ด้านขวา
* **Main Content (Scrollable):**
    * **Section 1: Form Input** (จัดเรียงเป็น 1 คอลัมน์แนวตั้งโอบรับหน้าจอมือถือ)
        * กล่องอัปโหลดภาพ Background (แสดงรูป Preview ขนาดเล็กเมื่ออัปโหลดแล้ว)
        * กล่องอัปโหลดภาพ Person (แสดงรูป Preview ขนาดเล็กเมื่ออัปโหลดแล้ว)
        * ช่องกรอก Description
        * ช่องกรอก Text Speak
    * **Section 2: Sticky Action Buttons** (ปุ่มกดคู่กันด้านล่างสุดของจอ หรือต่อท้ายฟอร์ม)
        * [Generate Image] (สีสันเด่นชัด เช่น Indigo)
        * [Generate Video] (สีสันเด่นชัด เช่น Violet)
    * **Section 3: History Grid**
        * แสดงผลเป็น 2 คอลัมน์บนมือถือ แสดงภาพที่เคยสร้าง พร้อมปุ่มกด Download เล็กๆ มุมขวาล่างของการ์ด
