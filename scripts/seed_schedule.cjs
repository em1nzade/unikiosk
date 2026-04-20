const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_lRcmopiQH25C@ep-square-scene-altol7k9.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require');

// Faculty 3: İqtisadiyyat və İdarəetmə, Course 1, Sector az
const FACULTY_ID = 3;
const COURSE_YEAR = 1;
const SECTOR = 'az';

const groups = ["366MN", "366Bİ1", "366Bİ2", "366MR1", "366MR2", "460MU", "366B", "570İ", "570M"];

// cells: key = "day_slot_groupIndex", value = {s: subject, t: teacher, r: room}
// day: 1-5, slot: 1-3, groupIndex: 0-8
// For multi-entry cells, entries separated by \n in each field
const cells = {
  // ═══ DAY 1 (Monday / I) ═══
  // Slot 1 (08:00-09:20)
  "1_1_0": { s: "İKT baza kompüter bilikləri-1", t: "İbrahimova Sevda", r: "571" },
  "1_1_2": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "Lətifova Məlahət", r: "560" },
  "1_1_3": { s: "İşgüzar yazışmalar (mühazirə)", t: "i.f.d. Musayev Əfqan", r: "502" },
  "1_1_4": { s: "İşgüzar yazışmalar (mühazirə)", t: "i.f.d. Musayev Əfqan", r: "502" },
  "1_1_8": { s: "İşgüzar yazışmalar (seminar)", t: "Şamilova Rəhimə", r: "509" },
  // Slot 2 (09:35-10:55)
  "1_2_0": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2 (Qrup 184BM)", t: "Lətifova Məlahət", r: "413" },
  "1_2_1": { s: "İşgüzar yazışmalar (seminar)", t: "Məmmədova Sevinc", r: "573" },
  "1_2_2": { s: "İKT baza kompüter bilikləri-1", t: "prof. Hüseynov Eldar", r: "431" },
  "1_2_3": { s: "Mikroiqtisadiyyat-2 (mühazirə)", t: "s.e.d. Nuriyev Cümşüd", r: "502" },
  "1_2_4": { s: "Mikroiqtisadiyyat-2 (mühazirə)", t: "s.e.d. Nuriyev Cümşüd", r: "502" },
  "1_2_6": { s: "İnformasiya kommunikasiya texnologiyaları-1", t: "İbrahimova Sevda", r: "583" },
  // Slot 3 (11:10-12:30)
  "1_3_1": { s: "Mülki müdafiə (mühazirə)", t: "Qılıcova Təranə", r: "218" },
  "1_3_4": { s: "Mülki müdafiə (mühazirə)", t: "Qılıcova Təranə", r: "205" },
  "1_3_7": { s: "İKT baza kompüter bilikləri-1\nXətti cəbr və riyazi analiz-2 (seminar)", t: "İbrahimova Sevda\ndos. Səmədzadə Fərahim", r: "570\n508" },
  "1_3_8": { s: "Mikroiqtisadiyyat-2", t: "Məmmədova Sevinc", r: "571" },

  // ═══ DAY 2 (Tuesday / II) ═══
  // Slot 1 (08:00-09:20)
  "2_1_0": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2 (Qrup 184BM)", t: "Lətifova Məlahət", r: "513" },
  "2_1_1": { s: "İşgüzar yazışmalar (seminar)", t: "Məmmədova Sevinc", r: "569" },
  "2_1_3": { s: "Xətti cəbr və riyazi analiz-2 (mühazirə)", t: "r.e.d. Məmmədov Mənsim", r: "502" },
  "2_1_4": { s: "Xətti cəbr və riyazi analiz-2 (mühazirə)", t: "r.e.d. Məmmədov Mənsim", r: "502" },
  "2_1_5": { s: "Dövlət idarəçiliyi nəzəriyyəsi-2 (mühazirə)", t: "Çobanlı Elşad", r: "584" },
  "2_1_6": { s: "İKT baza kompüter bilikləri-1", t: "İbrahimova Sevda", r: "573" },
  "2_1_8": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "p.f.d. Əliyev Aydın", r: "500" },
  // Slot 2 (09:35-10:55)
  "2_2_0": { s: "Mikroiqtisadiyyat-2\nİKT baza kompüter bilikləri-1", t: "Məmmədova Sevinc\nİbrahimova Sevda", r: "571\n571" },
  "2_2_1": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "Bayramlı Tükəzban", r: "573" },
  "2_2_2": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "Lətifova Məlahət", r: "569" },
  "2_2_3": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "f.f.d. Zeynalova Səbinə", r: "568" },
  "2_2_4": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "Kərimova Pərvin", r: "583" },
  "2_2_5": { s: "İKT baza kompüter bilikləri-1\nXətti cəbr və riyazi analiz-2", t: "İbrahimova Sevda\ndos. Eyyubov Ramazan", r: "509\n509" },
  "2_2_6": { s: "Qiymətli kağızlar\nMikroiqtisadiyyat-2 (seminar)", t: "Məmmədova Aytac\nMəmmədova Sevinc", r: "408\n408" },
  "2_2_7": { s: "İKT baza kompüter bilikləri-1", t: "prof. Hüseynov Eldar", r: "420" },
  "2_2_8": { s: "Qiymətli kağızlar", t: "Məmmədova Aytac", r: "560" },
  // Slot 3 (11:10-12:30)
  "2_3_0": { s: "Qiymətli kağızlar", t: "Məmmədova Aytac", r: "571" },
  "2_3_1": { s: "Mikroiqtisadiyyat-2\nQiymətli kağızlar", t: "Məmmədova Sevinc\nMəmmədova Aytac", r: "573\n573" },
  "2_3_2": { s: "Mülki müdafiə (mühazirə)", t: "Qılıcova Təranə", r: "218" },
  "2_3_4": { s: "Qiymətli kağızlar", t: "Məmmədova Aytac", r: "573" },

  // ═══ DAY 3 (Wednesday / III) ═══
  // Slot 1 (08:00-09:20)
  "3_1_0": { s: "İşgüzar yazışmalar (seminar)", t: "Məmmədova Sevinc", r: "563" },
  "3_1_1": { s: "Xətti cəbr və riyazi analiz-2", t: "Əşirova Həqiqət", r: "567" },
  "3_1_2": { s: "İKT baza kompüter bilikləri-1", t: "İbrahimova Sevda", r: "565" },
  "3_1_4": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "Kərimova Pərvin", r: "504" },
  "3_1_5": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "bm. Xanpaşayeva Mətanət", r: "500" },
  "3_1_7": { s: "Mikroiqtisadiyyat-2 (mühazirə)", t: "s.e.d. Nuriyev Cümşüd", r: "501" },
  // Slot 2 (09:35-10:55)
  "3_2_0": { s: "Xətti cəbr və riyazi analiz-2 (460MU mühazirə)", t: "dos. Eyyubov Ramazan", r: "501" },
  "3_2_3": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "f.f.d. Zeynalova Səbinə", r: "562" },
  "3_2_4": { s: "İKT baza kompüter bilikləri-1", t: "İbrahimova Sevda", r: "563" },
  "3_2_7": { s: "İşgüzar yazışmalar (mühazirə)", t: "i.f.d. Musayev Əfqan", r: "515" },
  // Slot 3 (11:10-12:30)
  "3_3_0": { s: "İKT baza kompüter bilikləri-1", t: "İbrahimova Sevda", r: "567" },
  "3_3_1": { s: "İKT baza kompüter bilikləri-1", t: "prof. Hüseynov Eldar", r: "420" },
  "3_3_3": { s: "Qiymətli kağızlar", t: "Məmmədova Aytac", r: "570" },
  "3_3_7": { s: "İşgüzar yazışmalar (seminar)", t: "Şamilova Rəhimə", r: "502" },
  "3_3_8": { s: "Qiymətli kağızlar", t: "Məmmədova Aytac", r: "573" },

  // ═══ DAY 4 (Thursday / IV) ═══
  // Slot 1 (08:00-09:20)
  "4_1_1": { s: "Mikroiqtisadiyyat-2 (mühazirə)", t: "s.e.d. Nuriyev Cümşüd", r: "501" },
  "4_1_3": { s: "İşgüzar yazışmalar (seminar)", t: "Məmmədova Sevinc", r: "517" },
  "4_1_4": { s: "İşgüzar yazışmalar (seminar)", t: "i.f.d. Musayev Əfqan", r: "509" },
  "4_1_5": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "bm. Xanpaşayeva Mətanət", r: "570" },
  "4_1_6": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "Məmmədova Fəridə", r: "512" },
  "4_1_8": { s: "İKT baza kompüter bilikləri-1", t: "prof. Hüseynov Eldar", r: "436" },
  // Slot 2 (09:35-10:55)
  "4_2_1": { s: "Qiymətli kağızlar (mühazirə)", t: "Şamilova Rəhimə", r: "501" },
  "4_2_4": { s: "Qiymətli kağızlar", t: "Çobanlı Elşad", r: "509" },
  "4_2_5": { s: "İqtisadi informatika (mühazirə)", t: "prof. Hüseynov Eldar", r: "504" },
  "4_2_7": { s: "Xətti cəbr və riyazi analiz-2 (mühazirə)", t: "dos. Səmədzadə Fərahim", r: "406" },
  // Slot 3 (11:10-12:30)
  "4_3_1": { s: "xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "Bayramlı Tükəzban", r: "509" },
  "4_3_2": { s: "Xətti cəbr və riyazi analiz-2", t: "dos. Səmədzadə Fərahim", r: "517" },
  "4_3_3": { s: "Xətti cəbr və riyazi analiz-2", t: "dos. Səmədzadə Fərahim", r: "510" },
  "4_3_5": { s: "İqtisadi informatika", t: "prof. Hüseynov Eldar", r: "504" },

  // ═══ DAY 5 (Friday / V) ═══
  // Slot 1 (08:00-09:20)
  "5_1_0": { s: "Xətti cəbr və riyazi analiz-2\nXətti cəbr və riyazi analiz-2", t: "Əşirova Həqiqət\nƏşirova Həqiqət", r: "565\n567" },
  "5_1_2": { s: "Mikroiqtisadiyyat-2", t: "Məmmədova Sevinc", r: "567" },
  "5_1_3": { s: "Qiymətli kağızlar (mühazirə)", t: "Şamilova Rəhimə", r: "413" },
  "5_1_5": { s: "İKT baza kompüter bilikləri-1", t: "İbrahimova Sevda", r: "500" },
  "5_1_6": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "Məmmədova Fəridə", r: "512" },
  "5_1_8": { s: "Xətti cəbr və riyazi analiz-2", t: "Əşirova Həqiqət", r: "567" },
  // Slot 2 (09:35-10:55)
  "5_2_0": { s: "İşgüzar yazışmalar (mühazirə)", t: "i.f.d. Musayev Əfqan", r: "501" },
  "5_2_2": { s: "İKT baza kompüter bilikləri-1\nMikroiqtisadiyyat-2", t: "İbrahimova Sevda\nMəmmədova Sevinc", r: "500\n500" },
  "5_2_4": { s: "Mikroiqtisadiyyat-2\nİKT baza kompüter bilikləri-1", t: "Məmmədova Sevinc\nİbrahimova Sevda", r: "509\n563" },
  "5_2_8": { s: "Qiymətli kağızlar (mühazirə)", t: "Şamilova Rəhimə", r: "502" },
  // Slot 3 (11:10-12:30)
  "5_3_1": { s: "İKT baza kompüter bilikləri-1", t: "İbrahimova Sevda", r: "565" },
  "5_3_2": { s: "İşgüzar yazışmalar (seminar)", t: "i.f.d. Musayev Əfqan", r: "509" },
  "5_3_3": { s: "Mikroiqtisadiyyat-2", t: "Məmmədova Sevinc", r: "565" },
  "5_3_4": { s: "İşgüzar yazışmalar (seminar)", t: "i.f.d. Musayev Əfqan", r: "509" },
  "5_3_5": { s: "Dövlət idarəçiliyi nəzəriyyəsi-2\nİnformasiya kommunikasiya texnologiyaları-1", t: "Çobanlı Elşad\nİbrahimova Sevda", r: "560\n560" },
  "5_3_8": { s: "Xarıcı dıldə ışgüzar və akademık kommunıkasıya-2", t: "p.f.d. Əliyev Aydın", r: "567" },
};

(async () => {
  // Upsert the schedule
  const result = await sql`
    INSERT INTO schedules (faculty_id, course_year, sector, groups, cells)
    VALUES (${FACULTY_ID}, ${COURSE_YEAR}, ${SECTOR}, ${JSON.stringify(groups)}::jsonb, ${JSON.stringify(cells)}::jsonb)
    ON CONFLICT (faculty_id, course_year, sector)
    DO UPDATE SET groups = EXCLUDED.groups, cells = EXCLUDED.cells, updated_at = now()
    RETURNING id
  `;
  console.log('Schedule inserted/updated, id:', result[0].id);
  console.log('Total cells:', Object.keys(cells).length);
})().catch(e => console.error(e));
