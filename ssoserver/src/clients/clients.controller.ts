import { 
    Controller, Get, Post, Body, Param, Delete, HttpException, HttpStatus 
  } from '@nestjs/common';
  import { ClientsService } from './clients.service';
  import { CreateClientDto } from './dto/create-client.dto';
  
  @Controller('clients')
  export class ClientsController {
    constructor(private readonly clientsService: ClientsService) {}
  
    @Post()
    async create(@Body() createClientDto: CreateClientDto) {
      console.log("createClientDto",createClientDto)
      try {
        const client = await this.clientsService.create(createClientDto);
        return { status: true, message: 'Client created successfully', client };
      } catch (error) {
        throw new HttpException(
          { status: false, message: error.message || 'Failed to create client' },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get()
    async findAll() {
      try {
        const clients = await this.clientsService.getAllClients();
        return { status: true, message: 'Clients retrieved successfully', clients };
      } catch (error) {
        throw new HttpException(
          { status: false, message: error.message || 'Failed to retrieve clients' },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string) {
      try {
        const client = await this.clientsService.findByClientId(id);
        if (!client) {
          throw new HttpException(
            { status: false, message: 'Client not found' },
            HttpStatus.NOT_FOUND
          );
        }
        return { status: true, message: 'Client retrieved successfully', client };
      } catch (error) {
        throw new HttpException(
          { status: false, message: error.message || 'Failed to retrieve client' },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Delete(':id')
    async remove(@Param('id') id: string) {
      try {
        const deleted = await this.clientsService.deleteClient(id);
        if (!deleted) {
          throw new HttpException(
            { status: false, message: 'Client not found or already deleted' },
            HttpStatus.NOT_FOUND
          );
        }
        return { status: true, message: 'Client deleted successfully' };
      } catch (error) {
        throw new HttpException(
          { status: false, message: error.message || 'Failed to delete client' },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
  