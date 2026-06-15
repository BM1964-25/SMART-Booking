alter table booking_profiles
  add column if not exists legal_privacy_url text default 'https://www.built-smart-hub.com/datenschutz',
  add column if not exists legal_imprint_url text default 'https://www.built-smart-hub.com/impressum';

update booking_profiles
set
  legal_privacy_url = coalesce(nullif(legal_privacy_url, ''), 'https://www.built-smart-hub.com/datenschutz'),
  legal_imprint_url = coalesce(nullif(legal_imprint_url, ''), 'https://www.built-smart-hub.com/impressum')
where legal_privacy_url is null
   or legal_privacy_url = ''
   or legal_imprint_url is null
   or legal_imprint_url = '';
