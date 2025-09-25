export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary rounded-2xl mx-auto flex items-center justify-center">
            <i className="fas fa-home text-3xl text-primary-foreground"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">모툰</h1>
            <p className="text-muted-foreground">우리 동네 중고마켓</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-6">
          <div className="text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-map-marker-alt text-secondary text-sm"></i>
              </div>
              <div>
                <h3 className="font-medium">동네 인증으로 안전한 거래</h3>
                <p className="text-sm text-muted-foreground">행정동 단위로 우리 동네 주민들과만 거래하세요</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-comments text-accent text-sm"></i>
              </div>
              <div>
                <h3 className="font-medium">실시간 채팅</h3>
                <p className="text-sm text-muted-foreground">판매자와 실시간으로 소통하고 거래하세요</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-heart text-primary text-sm"></i>
              </div>
              <div>
                <h3 className="font-medium">관심상품 저장</h3>
                <p className="text-sm text-muted-foreground">마음에 드는 상품을 저장하고 나중에 확인하세요</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <a
            href="/api/login"
            className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block"
            data-testid="button-login"
          >
            시작하기
          </a>
          
          <p className="text-xs text-muted-foreground">
            로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
