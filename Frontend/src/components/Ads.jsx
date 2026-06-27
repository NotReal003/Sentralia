export default function Ads() {
  const DESKTOP_ID = "2404990";
  const MOBILE_ID = "2404976";

  return (
    <div className="w-full flex justify-center overflow-x-hidden py-2">
      
      <div className="hidden lg:block w-full" style={{ maxWidth: 728 }}>
        <iframe
          title="a-ads-desktop"
          data-aa={DESKTOP_ID}
          src={`//ad.a-ads.com/${DESKTOP_ID}?size=728x90`}
          scrolling="no"
          className="w-full"
          style={{ height: 90, border: 0, backgroundColor: "transparent" }}
          allowTransparency={true}
        />
      </div>

      <div className="block sm:hidden w-full" style={{ maxWidth: 320 }}>
        <iframe
          title="a-ads-mobile"
          data-aa={MOBILE_ID}
          src={`//ad.a-ads.com/${MOBILE_ID}?size=320x50`}
          scrolling="no"
          className="w-full"
          style={{ height: 50, border: 0, backgroundColor: "transparent" }}
          allowTransparency={true}
        />
      </div>
    </div>
  );
}
