import { Controller } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {
    // Doannh thu, đơn hàng, khách hàng , số lượng trang phục có trong hệ thống 

    // Doanh thu theo tuần, tháng, năm -> đơn hàng , khách hàng ,  trang phục 

    // Phân bố danh mục và đơn hàng gần đây 
  }
}
