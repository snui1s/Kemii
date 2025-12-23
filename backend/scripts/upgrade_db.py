import sqlite3

DB_NAME = "elements.db"

def upgrade_database():
    print(f"🔧 กำลังอัปเกรดฐานข้อมูล {DB_NAME}...")
    
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # คำสั่ง SQL สำหรับเพิ่มคอลัมน์ใหม่ (ถ้ายังไม่มี)
        # column: analysis_result ประเภท TEXT
        cursor.execute("ALTER TABLE user ADD COLUMN analysis_result TEXT")
        
        conn.commit()
        conn.close()
        print("✅ สำเร็จ! เพิ่มคอลัมน์ 'analysis_result' เรียบร้อยแล้ว")
        print("👉 ข้อมูลเก่ายังอยู่ครบ เริ่มใช้งานฟีเจอร์ใหม่ได้เลย")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️ คอลัมน์นี้มีอยู่แล้วครับ ไม่ต้องทำอะไร")
        else:
            print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    upgrade_database()