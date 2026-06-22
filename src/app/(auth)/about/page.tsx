export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">뛰꼬양 소개</h1>
        <p className="text-gray-500 mt-1">About 1991RUNNERS</p>
      </div>

      <div className="card">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏃</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">1991RUNNERS</h2>
          <p className="text-gray-500">뛰꼬양 러닝 클럽</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">클럽 소개</h2>
        <p className="text-gray-600 leading-relaxed">
          1991RUNNERS는 함께 달리는 즐거움을 나누는 러닝 클럽입니다.
          정기런, 번개런, 대회 참가 등 다양한 활동을 통해 회원들과 함께 성장합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-[#e94560] mb-1">150+</div>
          <p className="text-sm text-gray-500">활동 회원</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-[#e94560] mb-1">매주</div>
          <p className="text-sm text-gray-500">정기런 진행</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-[#e94560] mb-1">🏅</div>
          <p className="text-sm text-gray-500">대회 참가</p>
        </div>
      </div>

      <div className="card bg-[#1a1a2e] text-white text-center py-8">
        <p className="text-lg font-medium mb-2">인스타그램 팔로우</p>
        <a href="https://instagram.com/1991runners" target="_blank" rel="noopener noreferrer" 
           className="text-[#e94560] font-bold text-xl hover:underline">
          @1991runners
        </a>
      </div>
    </div>
  )
}
