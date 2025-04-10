import { useState, useEffect, useRef } from 'react';
import useCmsStore from '../../store/cmsstore';
import { getAllDevicesAllRooms } from '../../api/Devices';
import CardRoom from '../../components/CardRoom';
import ModalRoom from '../../components/ModalRoom';

const AdminDashboard=() => {
  const { token }=useCmsStore((state) => state);
  const [rooms, setRooms]=useState([]);
  const [isWsReady, setIsWsReady]=useState(false);
  const [isModalOpen, setIsModalOpen]=useState(false);
  const [selectedRoom, setSelectedRoom]=useState(null);
  const ws=useRef(null);

  useEffect(() => {
    ws.current=new WebSocket(import.meta.env.VITE_WS_URL);

    ws.current.onopen=() => {
      console.log('WebSocket Connected');
      setIsWsReady(true);
    };

    ws.current.onmessage=(event) => {
      const msg=JSON.parse(event.data);
      handleCommand(msg)
    };

    ws.current.onerror=(error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onclose=() => {
      console.log('WebSocket Disconnected');
      setIsWsReady(false);
    };

    return () => {
      ws.current.close();
    };
  }, [token]);

  useEffect(() => {
    if (isWsReady&&token) {
      sendWebSocketMessage({ cmd: 'login', param: { token } });
    }
  }, [isWsReady, token]);

  useEffect(() => {
    fetchRoomsData(token);
  }, [token]);

  const fetchRoomsData=async (token) => {
    try {
      const res=await getAllDevicesAllRooms(token);
      setRooms(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const sendWebSocketMessage=(message) => {
    if (ws.current&&ws.current.readyState===WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not open, retrying...');
      setTimeout(() => sendWebSocketMessage(message), 500);
    }
  };

  // console.log(rooms)

  const handleCommand=(msg) => {
    const { cmd, param }=msg;

    switch (cmd) {
      case 'login':
        if (param.status=='success') {
          console.log('Login success');
        }
        break
      case 'getalldata':
        if (param.status=='success') {
          setRooms((prevData) => {
            const updatedData=prevData.map((room) => {
              const matchingData=param.data.find((newItem) => newItem.ip===room.ip_address);
              if (matchingData) {
                return {
                  ...room,
                  device_list: room.device_list.map((device) => {
                    return {
                      ...device,
                      attributes: device.attributes.map((attr) => {
                        const serverValue=matchingData.data[attr.holding_address];
                        if (serverValue!==undefined) {
                          return {
                            ...attr,
                            value: serverValue,
                          };
                        }
                        return attr;
                      }),
                    };
                  }),
                };
              }
              return room;
            });

            // console.log(updatedData);
            return updatedData;
          });

        } else {
          console.log('Failed to get all data');
        }
        break
      case 'data_update':
        console.log('Received data_update:', param);
        setRooms((prevData) => {
          const updatedData=prevData.map((room) => {
            if (room.ip_address==param.ip) {
              const updatedRoom={
                ...room,
                device_list: room.device_list.map((device) => {
                  return {
                    ...device,
                    attributes: device.attributes.map((attr) => {
                      const newItem=param.data.find((p) => p.address==attr.holding_address);
                      if (newItem) {
                        return {
                          ...attr,
                          value: newItem.value,
                        };
                      }
                      return attr;
                    }),
                  };
                }),
              };
              return updatedRoom;
            }
            return room;
          });
          // console.log(updatedData);
          return updatedData;
        });

        break;
      case ('room-status-update'):
        console.log('Room Status Updated:', param.data);
        // setStatusRealtime(param.data);
        setRooms((prevData) => {
          const updatedData=prevData.map((room) => {
            if (room.room_id==param.data.room_id) {
              const updatedRoom={
                ...room,
                device_list: room.device_list.map((device) => {
                  if (device.device_id!=param.data.device_id) return device;
                  return {
                    ...device,
                    attributes: device.attributes.map((attr) => {
                      if (attr.attr_id!=param.data.attr_id) return attr;
                      return {
                        ...attr,
                        value: param.data.value,
                      };
                    }),
                  };
                }),
              };
              return updatedRoom;
            }
            return room;
          });
          // console.log(updatedData)
          return updatedData;
        });

        break;
    }
  };

  const openModal=(room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const closeModal=() => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  // useEffect(() => {
  //   console.log('Rooms updated:', rooms);
  // }, [rooms]);

  useEffect(() => {
    if (selectedRoom) {
      const updatedRoom=rooms.find((room) => room.ip_address==selectedRoom.ip_address);
      if (updatedRoom) {
        setSelectedRoom(updatedRoom);
      }
    }
  }, [rooms]);


  return (
    <div className="w-full h-full overflow-auto">
      {isWsReady? (
        <h3 className="text-end font-semibold text-green-500 mb-4">WebSocket is ready</h3>
      ):(
        <h3 className="text-end font-semibold text-red-500 mb-4">WebSocket is not ready</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map((item, index) => (
          <CardRoom key={index} item={item} onClick={() => openModal(item)} sendWebSocketMessage={sendWebSocketMessage} />
        ))}
      </div>
      {isModalOpen&&selectedRoom&&(
        <ModalRoom isOpen={isModalOpen} onClose={closeModal} room={selectedRoom} sendWebSocketMessage={sendWebSocketMessage} />
      )}
    </div>


  );
};

export default AdminDashboard;
