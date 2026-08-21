/** Kiểu dữ liệu thô trả về từ cổng thông tin FTU (chỉ khai báo các field parser sử dụng). */

export interface RawPeriod {
  tiet: number
  gio_bat_dau: string
  gio_ket_thuc: string
}

export interface RawSessionEntry {
  tiet_bat_dau: number
  so_tiet: number
  ma_mon: string
  ten_mon: string
  id_tkb: string
  ma_nhom: string
  ma_lop: string
  ma_phong: string
  ngay_hoc: string
  is_nghi_day: boolean
}

export interface RawWeek {
  ds_thoi_khoa_bieu: RawSessionEntry[]
}

export interface RawScheduleResponse {
  data: {
    ds_tiet_trong_ngay: RawPeriod[]
    ds_tuan_tkb: RawWeek[]
    loai_thoi_gian: {
      NHHK: number
    }
  }
}

/** Một buổi học cụ thể, đã được chuẩn hoá để đưa lên Google Calendar. */
export interface ClassSession {
  id: string
  subjectCode: string
  subjectName: string
  room: string
  className: string
  group: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm */
  startTime: string
  /** HH:mm */
  endTime: string
}

export interface ParsedSchedule {
  semester: string
  sessions: ClassSession[]
}
