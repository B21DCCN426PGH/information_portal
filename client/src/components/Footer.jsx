import { useEffect, useState } from 'react';
import { FaFacebook, FaYoutube } from 'react-icons/fa';
import { fetchResource } from '../services/api';

export const Footer = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetchResource('faculty-info').then((data) => setInfo(data[0]));
  }, []);

  return (
  <footer className="mt-16 bg-slate-900 py-10 text-slate-200">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2">
      <div>
        <h3 className="text-xl font-semibold text-white">Khoa Công nghệ Thông tin</h3>
        <p className="mt-3 text-sm text-slate-300">
          Dẫn đầu đổi mới trong giáo dục công nghệ, nghiên cứu và hợp tác doanh nghiệp.
        </p>
        <div className="mt-4 flex gap-4 text-xl">
          <a href="https://facebook.com" className="hover:text-primary" aria-label="Facebook">
            <FaFacebook />
          </a>
          <a href="https://youtube.com" className="hover:text-primary" aria-label="YouTube">
            <FaYoutube />
          </a>
        </div>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white">Liên hệ</h4>
        <p className="mt-3 text-sm">Điện thoại: {info?.phone || '(+84) 123 456 789'}</p>
        <p className="text-sm">Email: {info?.email || 'fit@university.edu.vn'}</p>
        <p className="text-sm">Địa chỉ: {info?.address || '1 Đường Đại học, Thành phố'}</p>
      </div>
    </div>
    <p className="mt-10 text-center text-xs text-slate-400">
      © {new Date().getFullYear()} Khoa Công nghệ Thông tin.
    </p>
  </footer>
  );
};

