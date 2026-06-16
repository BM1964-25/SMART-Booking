export function EmbedShellStyle() {
  return (
    <style>
      {`
        [data-smart-booking-shell="header"],
        [data-smart-booking-shell="footer"] {
          display: none !important;
        }
      `}
    </style>
  );
}
