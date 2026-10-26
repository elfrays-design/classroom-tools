# 협업 포스트잇 QR 실시간 연동 설정

현재 Firebase Realtime Database URL은 설정했습니다: `https://classroom-tools-21bfd-default-rtdb.firebaseio.com/`. **웹 API 키는 등록했습니다. Authentication(이메일/비밀번호·익명 로그인), 교사 UID 및 데이터베이스 보안 규칙은 아직 확인·설정이 필요하여 실제 의견 제출은 검증되지 않았습니다.** 공개 읽기/쓰기 규칙으로 열지 마세요.

1. https://console.firebase.google.com 에서 교육청 정보보안·개인정보 처리 기준 검토 후 프로젝트를 만듭니다.
2. Authentication에서 이메일/비밀번호와 익명 로그인 방법을 사용 설정합니다.
3. Firebase Authentication 사용자 화면에서 교사 이메일/비밀번호 계정을 만들고 해당 UID를 복사합니다. 비밀번호는 GitHub에 올리지 마세요.
4. Realtime Database 생성 완료. 프로젝트 ID: `classroom-tools-21bfd`, 데이터베이스 URL: `https://classroom-tools-21bfd-default-rtdb.firebaseio.com/`.
5. wall-rules.json 파일의 PASTE_TEACHER_UID_HERE를 교사 UID로 바꾸어 Realtime Database 규칙으로 게시합니다.
6. `wall-config.js`의 **Firebase 웹 API 키와 Realtime Database URL은 이미 등록했습니다.** 서비스 계정 비밀 키나 관리자 암호는 GitHub에 올리지 마세요.
7. GitHub Pages 배포 후 협업 포스트잇 메뉴에서 교사 이메일/비밀번호로 로그인하여 주제 생성 → QR 배포 → 학생 접속 → 전송 → 교사 화면 확인을 테스트합니다.

보안 안내: 학생 실명 없이 의견만 받지만 Firebase 익명 인증 UID 및 본문이 서버에 저장됩니다. QR 유출 시 학급 외부 참여가 가능할 수 있으며, 브라우저를 초기화한 학생의 중복 제출은 완전히 막을 수 없습니다. 학생 제출글은 교사만 전체 열람하고 숨길 수 있게 구성했습니다. 기본 활성화 전에 반드시 실제 보안 규칙과 과금 한도, 삭제 주기를 확인하세요.

다른 수업도구의 학생 명단·기록은 Firebase로 전송하지 않습니다. 교사 비밀번호는 코드에 넣지 않습니다. 의견 보관 및 삭제 정책은 별도로 운영해야 합니다.