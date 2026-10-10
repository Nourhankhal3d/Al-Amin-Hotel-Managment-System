import type { ReactNode, SVGProps } from 'react';

/**
 * Lightweight inline icon set used by the redesigned Payments / Personal Shift pages.
 * Keeps the bundle free of extra icon dependencies while matching the Figma line style.
 */

type IconProps = SVGProps<SVGSVGElement>;

function baseIcon({ className = '', ...props }: IconProps, children: ReactNode) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const WalletIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
      <path d="M21 10h-4a2 2 0 0 0 0 4h4z" />
    </>
  ));

export const CashIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ));

export const CardIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ));

export const TransferIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M4 9h14l-3-3" />
      <path d="M20 15H6l3 3" />
    </>
  ));

export const HashIcon = (props: IconProps) =>
  baseIcon(props, <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />);

export const CalcIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h4" />
    </>
  ));

export const SearchIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ));

export const PlusIcon = (props: IconProps) => baseIcon(props, <path d="M12 5v14M5 12h14" />);

export const ExportIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M12 3v10" />
      <path d="m8 7 4-4 4 4" />
      <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </>
  ));

export const ReceiptIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ));

export const PrintIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M7 8V4h10v4" />
      <rect x="4" y="8" width="16" height="8" rx="1.5" />
      <path d="M7 14h10v6H7z" />
    </>
  ));

export const ShareIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6" />
    </>
  ));

export const PdfIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 14h1.5a1.5 1.5 0 0 0 0-3H9v6" />
      <path d="M14 17v-6h1a2 2 0 0 1 0 4h-1" />
    </>
  ));

export const ChartIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M4 19h16" />
      <path d="m5 15 4-5 3.5 3L19 6" />
    </>
  ));

export const SparkIcon = (props: IconProps) =>
  baseIcon(props, <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />);

export const SignatureIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M3 17c2.5 0 3-8 5-8s1.5 8 4 8 2.5-4 4.5-4 2 2 4.5 2" />
      <path d="M4 21h16" />
    </>
  ));

export const ChevronRightIcon = (props: IconProps) => baseIcon(props, <path d="m9 6 6 6-6 6" />);

export const DownloadIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ));


export const ChevronLeftIcon = (props: IconProps) => baseIcon(props, <path d="m15 6-6 6 6 6" />);

/** Stylized Al-Amin Hotel brand mark used in the personal shift report header. */
export function AlAminLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="52"
      height="52"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Al Amin Hotel"
    >
      <rect x="1.5" y="1.5" width="61" height="61" rx="16" fill="#2fa84f" />
      <rect x="5" y="5" width="54" height="54" rx="13.5" fill="none" stroke="#f6f4ee" strokeOpacity="0.35" strokeWidth="1.2" />
      <text x="32" y="34" textAnchor="middle" fill="#f6f4ee" fontSize="19" fontWeight="800" fontFamily="Cairo, 'Segoe UI', Tahoma, sans-serif">
        الأمين
      </text>
      <text x="32" y="48" textAnchor="middle" fill="#f6f4ee" fillOpacity="0.85" fontSize="8.4" fontWeight="700" letterSpacing="1" fontFamily="'Segoe UI', Tahoma, sans-serif">
        AL AMIN
      </text>
    </svg>
  );
}

export const CloseIcon = (props: IconProps) => baseIcon(props, <path d="M6 6l12 12M18 6 6 18" />);

export const CheckIcon = (props: IconProps) => baseIcon(props, <path d="m5 12.5 4.5 4.5L19 7.5" />);

export const ClockIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ));

export const UserIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </>
  ));

export const BedIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M3 18V7" />
      <path d="M3 13h18a2 2 0 0 1 2 2v3" />
      <path d="M3 18h18" />
      <circle cx="7.5" cy="10" r="1.5" />
    </>
  ));

export const CalendarIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ));

export const NoteIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M5 4h11l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M15 4v5h5M8 13h7M8 17h5" />
    </>
  ));

export const WrenchIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M14.5 6.5a5 5 0 0 0-6.4 6.4L3 18l3 3 5.1-5.1a5 5 0 0 0 6.4-6.4L14 13l-3-3z" />
    </>
  ));

export const SettingsIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
      <path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.5a7.7 7.7 0 0 1-1.4.8l-.2 1.5h-2.4l-.3-1.5a7.7 7.7 0 0 1-1.5-.1l-1 .9-2-1.2.5-1.4a7.7 7.7 0 0 1-.8-1.4l-1.5-.2v-2.4l1.5-.3a7.7 7.7 0 0 1 .1-1.5l-.9-1 1.2-2 1.4.5a7.7 7.7 0 0 1 1.4-.8l.2-1.5h2.4l.3 1.5a7.7 7.7 0 0 1 1.5.1l1-.9 2 1.2-.5 1.4a7.7 7.7 0 0 1 .8 1.4l1.5.2v2.4l-1.5.3a7.7 7.7 0 0 1-.4 1.4z" />
    </>
  ));

export const LogoutIcon = (props: IconProps) =>
  baseIcon(props, (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    </>
  ));
